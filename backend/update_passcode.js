import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please provide MONGODB_URI environment variable.");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Updating passcode...");
    
    // We update the only document in the Settings collection
    const SettingsModel = mongoose.model('Settings', new mongoose.Schema({}, { strict: false }));
    
    await SettingsModel.updateOne({}, { $set: { adminPasscode: "hello123" } }, { upsert: true });
    
    console.log("Passcode successfully updated to 'hello123' in the database! 🎉");
    process.exit(0);
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
