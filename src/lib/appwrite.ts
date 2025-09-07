import { Client, Storage, ID } from 'appwrite';

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.error("Appwrite environment variables are not set. Please check your .env file.");
} else {
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
}

const storage = new Storage(client);

const BUCKET_ID = 'menu-images'; // Use a consistent bucket ID

/**
 * Uploads a file to Appwrite Storage.
 * @param file The file to upload.
 * @returns The URL of the uploaded file.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!endpoint || !projectId) {
    throw new Error("Appwrite is not configured.");
  }
  try {
    const response = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
    );

    // Construct the public URL for the file
    const fileId = response.$id;
    const url = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
    
    return url;
  } catch (error) {
    console.error('Error uploading image to Appwrite:', error);
    throw new Error('Failed to upload image.');
  }
}
