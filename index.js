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
        // Yoink!
        const aggregateExec = mongoose_1.default.Aggregate.prototype.exec;
        const queryExec = mongoose_1.default.Query.prototype.exec;
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
         * Sort the current query by `__seed` and limit the results
         *
         * @param limit The number of documents to limit to
         */
        mongoose_1.default.Aggregate.prototype.quickSample = function (limit = 50) {
            return this.sort({ __seed: 1 }).limit(limit);
        };
        /**
         * Executes the aggregate pipeline on the currently bound Model.
         */
        mongoose_1.default.Aggregate.prototype.exec = async function () {
            // Call the executor super
            const results = await aggregateExec.apply(this);
            if (
            // If we sorted by seed
            this.pipeline().some(stage => "$sort" in stage && "__seed" in stage["$sort"]) &&
                // If we can reliably retrieve IDs for each item, reset their seeds
                results && Array.isArray(results) && results.some(item => item._id !== undefined)) {
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
        schema.query.quickSample = function (limit = 50) {
            return this.sort({ __seed: 1 }).limit(limit);
        };
        /**
         * Executes the query
         */
        mongoose_1.default.Query.prototype.exec = async function () {
            // Call the executor super
            const results = await queryExec.apply(this);
            // Get query options
            const options = this.getOptions();
            if (
            // If we sorted by seed
            options.sort && "__seed" in options.sort &&
                // If we can reliably retrieve IDs for each item, reset their seeds
                results && Array.isArray(results) && results.some(item => item._id !== undefined)) {
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