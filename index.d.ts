import Mongoose from "mongoose";
declare module "mongoose" {
    interface Aggregate<ResultType> {
        /**
         * Sort the current aggregation by `__seed` and limit the results
         *
         * @param limit The number of documents to return
         */
        quickSample(this: Mongoose.Aggregate<ResultType>, limit: number): Mongoose.Aggregate<ResultType>;
    }
    interface Query<ResultType, DocType, THelpers = {}> {
        /**
         * Sort the current query by `__seed` and limit the results
         *
         * @param limit The number of documents to return
         */
        quickSample(limit: number): Mongoose.QueryWithHelpers<ResultType, DocType, THelpers>;
    }
    interface Schema {
        /**
         * Seed used by the QuickSample plugin to randomly sort results quickly and efficiently
         */
        __seed: Mongoose.Schema.Types.Number;
    }
}
export declare namespace QuickSample {
    type Type = {
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
    function Plugin<SchemaType extends Mongoose.Schema<any, any, any, any, any>>(schema: SchemaType, { autoInsert, ...options }?: Mongoose.SchemaTypeOptions<number> & {
        /**
         * Automatically insert `__seed` into any record that does not already have one
         */
        autoInsert?: boolean;
    }): void;
}
//# sourceMappingURL=index.d.ts.map