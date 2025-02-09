/* eslint-disable @next/next/no-img-element */
import { cutoffMessage } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import * as Sentry from '@sentry/nextjs';

interface LinkPreviewProps {
  url: string;
}

interface PreviewData {
  title: string;
  description: string;
  image: string;
}

const getLinkPreview = async (url: string): Promise<PreviewData | null> => {
  try {
    // We need to use a proxy to fetch the url because of CORS
    const response = await fetch('/api/url-proxy?url=' + url);
    const data = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const title = doc.querySelector('title')?.textContent || '';

    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '';

    const image =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      '';

    if (!image) {
      return null;
    }

    return { title, description, image };
  } catch (error) {
    Sentry.captureException(error);
    console.error(error);
    return null;
  }
};

/**
 * Component to show a preview of a link.
 * The component fetches the link ogp data and shows the title and image.
 */
const LinkPreview = (props: LinkPreviewProps) => {
  const { url } = props;

  // State to hold the link preview data and loading status
  const { data: previewData } = useQuery({
    queryKey: ['link-preview', url],
    queryFn: async () => {
      return await getLinkPreview(url);
    },
  });

  const handleClick = () => {
    window.open(url, '_blank');
  };

  if (!previewData) {
    return <></>;
  }

  return (
    <div
      className="flex flex-col items-center h-full relative"
      onClick={handleClick}
    >
      {previewData.image && (
        <img
          src={previewData.image}
          alt="Link Preview"
          className="rounded-lg  b-0"
        />
      )}
      <div className="p-2 w-full text-sm absolute bottom-0 text-gray-200 bg-black bg-opacity-60">
        {cutoffMessage(previewData.title, 32)}
      </div>
    </div>
  );
};

export default LinkPreview;
