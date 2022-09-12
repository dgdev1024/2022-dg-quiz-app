/**
 * @file api/user.ts
 */

import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@lib/prisma";
import { cloudinary } from "@lib/cloudinary";
import {
  GetUserResponseBody,
  PutUserResponseBody,
  UserUpdateData,
} from "types/quiz-app-types";

/**
 * If, while updating the user's details, an image data URL is provided to update their
 * profile picture, this function will upload that image to Cloudinary and return
 * a Cloudinary URL pointing to that picture.
 *
 * @param {string} url The data URL of the image to upload.
 * @param {string} emailAddress The user's email address is needed to determine the image's public id.
 */
const uploadDataUrl = async (url: string, emailAddress: string) => {
  // The public ID for the uploaded image is determined from the user's email address, by
  // relplacing all instances of the at sign ('@') and period ('.') with underscores ('_').
  const publicIdFromEmail = emailAddress.replace(/[\@\.]/g, "_");

  // Upload the image.
  const cloudinaryUpload = await cloudinary.uploader.upload(url, {
    overwrite: true,
    public_id: publicIdFromEmail,
    folder: "quiz-app/profile-pictures",
  });

  return cloudinaryUpload;
};

const methods = {
  async get(req: NextApiRequest, res: NextApiResponse<GetUserResponseBody>) {
    // Make sure the user accessing this endpoint is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // Get the ID of the user to be fetched from the provided query parameter.
      // If no such ID is provided, then default to the ID of the logged-in user.
      const userId = (req.query?.id || session.user.id) as string;

      // Fetch the user with the given ID from the database.
      const getUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Report if the user could not be found.
      if (!getUser) {
        return res.status(404).json({ error: "No user exists with this ID." });
      }

      // Check to see if the user being fetched is the currently logged-in user.
      const isSelf = getUser.id === session.user.id;

      // Construct the User response object to be returned.
      const returnedResponse: GetUserResponseBody = {
        user: {
          id: getUser.id,
          name: getUser.name || "",
          image: getUser.image || "",
          emailAddress: getUser.email,
          isSelf,
        },
      };

      // Return the user's details and quizzes in the response.
      return res.status(200).json(returnedResponse);
    } catch (err) {
      console.error(`GET /api/user: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },
  async put(req: NextApiRequest, res: NextApiResponse<PutUserResponseBody>) {
    // Make sure the user accessing this endpoint is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // Attempt to grab the full name and image data URL from the request body.
      const fullName = req.body?.fullName as string;
      const imageDataUrl = req.body?.imageDataUrl as string;

      // Store the update data here.
      const updateData: UserUpdateData = {
        name: fullName || session.user.name,
      };

      // If a new image data url was given, upload it first before inserting it
      // into the update data object.
      if (imageDataUrl) {
        const upload = await uploadDataUrl(imageDataUrl, session.user.email);
        updateData.image =
          process.env.NODE_ENV === "production"
            ? upload.url
            : upload.secure_url;
      }

      // Update the user's record in the database with the new information.
      const updateUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });

      // Return the updated user's details and quizzes in the response.
      return res.status(200).json({
        user: {
          id: updateUser.id,
          name: updateUser.name || "",
          image: updateUser.image || "",
          emailAddress: updateUser.email,
          isSelf: updateUser.id === session.user.id,
        },
      });
    } catch (err) {
      console.error(`PUT /api/user: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "PUT":
      return await methods.get(req, res);
    case "GET":
      return await methods.put(req, res);
  }

  return res.status(405).json({ error: "This method is not allowed." });
};
