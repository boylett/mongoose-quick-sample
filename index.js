"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickSample = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var QuickSample;
(function (QuickSample) {
    /**
     * Sort the current query by `__seed`, limit the results, then reset the seeds
     *
     * @param schema The schema to add the `__seed` field to
     * @param options Additional type options for the `__seed` path
     */
    function Plugin(schema, { autoInsert = true, ...options } = {}) {
        // Add the seed to the schema
        schema.add({
            __seed: {
                default: () => Math.random(),
                index: true,
                ...options,
                type: mongoose_1.default.Schema.Types.Number,
            },
        });
        /**
         * Sort the current query by `__seed`, limit the results, then reset the seeds
         *
         * @param limit The number of documents to return
         */
        mongoose_1.default.Aggregate.prototype.quickSample = async function (limit = 50) {
            // Get the model
            const model = this.model();
            // If the __seed is not part of the schema, throw an error
            if (!model.schema.paths.__seed) {
                throw new Error(`'__seed' is not part of the '${model.modelName}' schema`);
            }
            // Execute the aggregation
            const results = (await this
                .sort({ __seed: 1 })
                .limit(limit)
                .exec());
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
                                    $in: [null, ""],
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
        schema.query.quickSample = async function (limit = 50) {
            // If the __seed is not part of the schema, throw an error
            if (!this.model.schema.paths.__seed) {
                throw new Error(`'__seed' is not part of the '${this.model.modelName}' schema`);
            }
            // Execute the query
            const results = (await this
                .sort({ __seed: 1 })
                .limit(limit)
                .exec());
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
                                    $in: [null, ""],
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
    QuickSample.Plugin = Plugin;
})(QuickSample || (exports.QuickSample = QuickSample = {}));
//# sourceMappingURL=index.js.map