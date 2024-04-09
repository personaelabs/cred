import { Loader2 } from 'lucide-react';

const CredddSearchSpinner = () => {
  return (
    <div className="flex flex-row items-center">
      <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
      <div className="text-center">
        <div>Searching for creddd</div>
        <div>(this could take a moment...)</div>
      </div>
    </div>
  );
};

export default CredddSearchSpinner;
