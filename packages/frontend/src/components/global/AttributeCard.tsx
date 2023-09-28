export type Attribute = {
  label: string;
  type: string;
  value: string | undefined | number;
};
type AttributeCardProps = {
  attributes: Attribute[];
};

export const AttributeCard = (props: AttributeCardProps) => {
  return (
    <form>
      {props.attributes.map((attribute) => (
        <div className="mb-6 md:flex md:items-center" key={attribute.label}>
          <div className="md:w-1/3">
            <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
              {attribute.label}
            </label>
          </div>
          <div className="md:w-2/3">
            {attribute.type === 'url' ? (
              <a
                href={attribute.value?.toString()}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {attribute.label}
              </a>
            ) : (
              <input
                className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                type="text"
                value={attribute.value}
                disabled
                style={{
                  opacity: 1,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </form>
  );
};
