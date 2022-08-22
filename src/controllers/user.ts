import { Request, Response } from "express";
import User from "../models/user";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password }).exec();
  if (user) {
    return res.status(200).json({
      success: true,
    });
  }
  return res.status(401).json({
    success: false,
    error: `Authentication failed!`,
  });
};

export const getUser = async (req: Request, res: Response) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).exec();
  if (user) {
    return res.status(200).json({
      success: true,
      user,
    });
  }
  return res.status(404).json({
    success: false,
    error: `User not found`,
  });
};
