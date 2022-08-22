import { Request, Response } from "express";
import User from "../models/user";

export const setAlerts = async (req: Request, res: Response) => {
  const { username, alerts } = req.body;
  const user = await User.find({ username }).exec();
  if (user) {
    await User.updateOne({ username }, { alerts, notified: [] });
    return res.status(200).json({ success: true });
  }
  return res
    .status(400)
    .json({ success: false, error: `User ${username} not found!` });
};

export const toggleAlertsActive = async (req: Request, res: Response) => {
  const { username, active } = req.body;
  const user = await User.find({ username }).exec();
  if (user) {
    await User.updateOne({ username }, { active });
    return res.status(200).json({ success: true });
  }
  return res
    .status(400)
    .json({ success: false, error: `User ${username} not found!` });
};
