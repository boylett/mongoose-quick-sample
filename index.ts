import Mongoose from "mongoose";

declare module "mongoose" {
  interface Aggregate<ResultType> {
    /**
     * Sort the current aggregation by `__seed` and limit the results
     *
     * @param limit The number of documents to return
     */
    quickSample (
      this: Mongoose.Aggregate<ResultType>,
      limit: number
    ): Mongoose.Aggregate<ResultType>;
  }

  interface Query<ResultType, DocType, THelpers = {}, RawDocType = unknown, QueryOp = "find", TInstanceMethods = Record<string, never>> {
    /**
     * Sort the current query by `__seed` and limit the results
     *
     * @param limit The number of documents to return
     */
    quickSample<RawDocTypeOverride extends { [ P in keyof RawDocType ]?: any } = {}> (
      limit: number
    ): QueryWithHelpers<
      IfEquals<
        RawDocTypeOverride,
        {},
        ResultType,
        ResultType extends any[]
        ? ResultType extends HydratedDocument<any>[]
        ? HydratedDocument<RawDocTypeOverride>[]
        : RawDocTypeOverride[]
        : (ResultType extends HydratedDocument<any>
          ? HydratedDocument<RawDocTypeOverride>
          : RawDocTypeOverride) | (null extends ResultType ? null : never)
      >,
      DocType,
      THelpers,
      IfEquals<
        RawDocTypeOverride,
        {},
        RawDocType,
        RawDocTypeOverride
      >,
      QueryOp,
      TInstanceMethods
    >;
  }

  interface Schema {
    /**
     * Seed used by the QuickSample plugin to randomly sort results quickly and efficiently
     */
    __seed: Mongoose.Schema.Types.Number;
  }
}

export namespace QuickSample {
  export type Type = {
    /**
     * Seed used by the QuickSample plugin to randomly sort results quickly and efficiently
     */
    __seed: number;
  };

  /**
   * Sort the current query by `__seed`, limit the results, then reset the seeds
   *
   * @param schema The schema to add the `__seed` field to
   * @param options Additional type options for the `__seed` path
   */
  export function Plugin<
    SchemaType extends Mongoose.Schema<any, any, any, any, any>
  > (
    schema: SchemaType, {
      autoInsert = true,
      ...options
    }: Mongoose.SchemaTypeOptions<number> & {
      /**
       * Automatically insert `__seed` into any record that does not already have one
       */
      autoInsert?: boolean;
    } = {}
  ): void {
    // Yoink!
    const aggregateExec = Mongoose.Aggregate.prototype.exec;
    const queryExec = Mongoose.Query.prototype.exec;

    // Add the seed to the schema
    schema.add({
      __seed: {
        default: () => Math.random(),
        index: true,
        ...options,
        type: Mongoose.Schema.Types.Number,
      },
    });

    /**
     * Sort the current query by `__seed` and limit the results
     *
     * @param limit The number of documents to limit to
     */
    Mongoose.Aggregate.prototype.quickSample = function <ResultType> (
      this: Mongoose.Aggregate<ResultType>,
      limit: number = 50
    ): Mongoose.Aggregate<ResultType> {
      return this.sort({ __seed: 1 }).limit(limit);
    };

    /**
     * Executes the aggregate pipeline on the currently bound Model.
     */
    Mongoose.Aggregate.prototype.exec = async function () {
      // Call the executor super
      const results = await aggregateExec.apply(this);

      if (
        // If we sorted by seed
        this.pipeline().some(stage => "$sort" in stage && "__seed" in stage[ "$sort" ]) &&
        // If we can reliably retrieve IDs for each item, reset their seeds
        results && Array.isArray(results) && results.some(item => item._id !== undefined)
      ) {
        await this.model()
          .updateMany(autoInsert
            ? {
              $or: [
                {
                  _id: {
                    $in: results.map(item => item._id),
                  },
                },
                {
                  __seed: {
                    $in: [ null, "" ],
                  },
                },
              ],
            }
            : {
              _id: {
                $in: results.map(item => item._id),
              },
            }, [
            {
              $set: {
                __seed: {
                  $rand: {},
                },
              },
            },
          ]);
      }

      return results;
    };

    /**
     * Sort the current query by `__seed`, limit the results, then reset the seeds
     *
     * @param limit The number of documents to return
     */
    schema.query.quickSample = function <ResultType, DocType> (
      this: Mongoose.QueryWithHelpers<ResultType, DocType>,
      limit: number = 50
    ) {
      return this.sort({ __seed: 1 }).limit(limit);
    };

    /**
     * Executes the query
     */
    Mongoose.Query.prototype.exec = async function () {
      // Call the executor super
      const results = await queryExec.apply(this);

      // Get query options
      const options = this.getOptions();

      if (
        // If we sorted by seed
        options.sort && "__seed" in options.sort &&
        // If we can reliably retrieve IDs for each item, reset their seeds
        results && Array.isArray(results) && results.some(item => item._id !== undefined)
      ) {
        await this.model
          .updateMany(autoInsert
            ? {
              $or: [
                {
                  _id: {
                    $in: results.map(item => item._id),
                  },
                },
                {
                  __seed: {
                    $in: [ null, "" ],
                  },
                },
              ],
            }
            : {
              _id: {
                $in: results.map(item => item._id),
              },
            }, [
            {
              $set: {
                __seed: {
                  $rand: {},
                },
              },
            },
          ]);
      }

      return results;
    };
  }
}