import { Request } from "express";
import { Response } from "express-serve-static-core";
import User from "../models/user";

export const subscribe = async (req: Request, res: Response) => {
  const { username, subscription } = req.body;
  const user = await User.find({ username }).exec();
  if (user) {
    await User.updateOne({ username }, { subscription });
    return res.status(200).json({ success: true });
  }
  return res
    .status(400)
    .json({ success: false, error: `User ${username} not found!` });
};
