import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

import CldImage from './cldimage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryResource {
  context?: {
    alt?: string;
    caption?: string;
  };
  public_id: string;
  secure_url: string;
}

async function SampleCloudinary() {
  const response = await cloudinary.api.resources_by_tag(
    'nextjs-server-actions-upload-sampleImages',
    { context: true }
  );
  const sampleImages = response.resources;

  async function create(formData: FormData) {
    'use server';
    const file = formData.get('image') as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          tags: ['nextjs-server-actions-upload-sampleImages'],
          folder: 'sample-images/cards',
          upload_preset: 'my-next-app',
        },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );

      uploadStream.end(buffer);
    });

    revalidatePath('/');
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add a New Image</h2>
      <form
        action={create}
        className="bg-white border border-slate-200 dark:border-slate-500 rounded p-6 mb-6"
      >
        <p className="mb-6">
          <label htmlFor="image" className="block font-semibold text-sm mb-2">
            Select an Image to Upload
          </label>
          <Input
            id="image"
            className="block w-full border-slate-400 rounded focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="file"
            name="image"
            required
          />
        </p>
        <Button>Submit</Button>
      </form>
      <h2 className="text-xl font-bold mb-4">Images</h2>

      <ul className="grid gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {sampleImages.map((sampleImage: CloudinaryResource) => {
          return (
            <li
              key={sampleImage.public_id}
              className="rounded overflow-hidden bg-white dark:bg-slate-700"
            >
              <div className="relative">
                <CldImage
                  width={800}
                  height={600}
                  src={sampleImage.public_id}
                  alt={sampleImage.context?.alt || ''}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SampleCloudinary;
