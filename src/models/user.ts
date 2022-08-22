import mongoose from "mongoose";
import { PushSubscription } from "web-push";

export interface IAlert {
  category: string;
  team?: string;
  type: "Over" | "Under or Equal";
  value: string;
}

export interface IUserDocument extends mongoose.Document {
  username: string;
  password: string;
  subscription?: PushSubscription;
  alerts: IAlert[];
  notified: string[]; // list of events Ids that user was already notified
  active: boolean;
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, require: true },
  subscription: { type: Object },
  alerts: [{ type: Object }],
  notified: [String],
  active: { type: Boolean },
});

const User = mongoose.model<IUserDocument>("User", UserSchema);
export default User;
