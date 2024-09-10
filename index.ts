import Mongoose from "mongoose";

declare module "mongoose" {
  interface Aggregate<ResultType> {
    /**
     * Sort the current aggregation by `__seed`, limit the results, then reset the seeds
     *
     * @param limit The number of documents to return
     */
    quickSample (
      this: Mongoose.Aggregate<ResultType>,
      limit: number
    ): Promise<ResultType>;
  }

  interface Query<ResultType, DocType, THelpers = {}> {
    /**
     * Sort the current query by `__seed`, limit the results, then reset the seeds
     *
     * @param limit The number of documents to return
     */
    quickSample (
      limit: number
    ): Promise<ResultType>;
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
     * Sort the current query by `__seed`, limit the results, then reset the seeds
     *
     * @param limit The number of documents to return
     */
    Mongoose.Aggregate.prototype.quickSample = async function <ResultType> (
      this: Mongoose.Aggregate<ResultType>,
      limit: number = 50
    ): Promise<ResultType> {
      // Get the model
      const model = this.model();

      // If the __seed is not part of the schema, throw an error
      if (!model.schema.paths.__seed) {
        throw new Error(`'__seed' is not part of the '${ model.modelName }' schema`);
      }

      // Execute the aggregation
      const results = (
        await this
          .sort({ __seed: 1 })
          .limit(limit)
          .exec()
      );

      // If we can reliably retrieve IDs for each item, reset their seeds
      if (results && Array.isArray(results) && results.some(item => item._id !== undefined)) {
        await model
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
    schema.query.quickSample = async function <ResultType> (
      this: Mongoose.QueryWithHelpers<any, Mongoose.HydratedDocument<ResultType>>,
      limit: number = 50
    ): Promise<ResultType> {
      // If the __seed is not part of the schema, throw an error
      if (!this.model.schema.paths.__seed) {
        throw new Error(`'__seed' is not part of the '${ this.model.modelName }' schema`);
      }

      // Execute the query
      const results = (
        await this
          .sort({ __seed: 1 })
          .limit(limit)
          .exec()
      );

      // If we can reliably retrieve IDs for each item, reset their seeds
      if (results && Array.isArray(results) && results.some(item => item._id !== undefined)) {
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