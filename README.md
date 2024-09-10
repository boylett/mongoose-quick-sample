# [Mongoose](https://mongoosejs.com) QuickSample [![1.0.1](https://badgen.net/badge/npm/1.0.1/blue)](https://www.npmjs.com/package/mongoose-quick-sample)
Quick and efficient random sampling of records utilizing a seed field.

Rather than relying on the painfully slow `$sample` aggregation stage, Mongoose QuickSample embeds a simple numeric `__seed` field in your schemas that is autopopulated with a random number between 0 and 1.

You can sort by this field using the `quickSample` aggregation method or query helper method, and the seed will be automatically updated after each sample.

The `__seed` field is indexed by default, which results in an *extremely fast* random sample.

## Installation

Install via npm (or your favourite package manager)

`npm install mongoose-quick-sample@latest`

Import and install the Mongoose plugin

```typescript
import mongoose from "mongoose";
import { QuickSample } from "mongoose-quick-sample";

mongoose.plugin(QuickSample.Plugin);
```

## Usage

You can use `quickSample` on aggregations and standard queries. Give it a go!

```typescript
// Returns 10 random users
const users = await UserModel
  .find()
  .quickSample(10);

// Returns 10 random posts by the 10 random users
const posts = await PostsModel
  .aggregate([
    {
      $match: {
        user: {
          $in: users.map(user => user._id)
        }
      }
    }
  ])
  .quickSample(10);
```

> [!NOTE]
> When you run your first `quickSample` on any given schema, mongoose will automatically populate all documents in the collection that do not yet have a `__seed` field.
>
> If your collection is particularly large or you'd rather do this yourself, you can set `autoInsert` to false in the plugin options (see below).

## Configuration

The QuickSample plugin accepts an `options` object that inherits properties from a [numeric schema type](https://mongoosejs.com/docs/schematypes.html#number-validators). That is, it expects you to be configuring the `__seed` path in the schema.

The one exception to this is the `autoInsert` property, which disables the behaviour of automatically populating missing `__seed` fields across your whole collection.

```typescript
mongoose.plugin(QuickSample.Plugin, {
  // Let me sow my own oats!
  autoInsert: false,

  // Typical mongoose numeric type props
  default: () => weightedRand({ 0: 0.3, 0.5: 0.6, 1: 0.1 }),
  index: false,
});
```
