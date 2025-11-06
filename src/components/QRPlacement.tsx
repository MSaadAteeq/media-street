import smallBusinessImage from "@/assets/small-business-partnerships.jpg";

const POSAdvertising = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl overflow-hidden shadow-medium">
            <img 
              src={smallBusinessImage} 
              alt="Small business owners collaborating and forming local partnerships on main street" 
              className="w-full h-auto" 
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center px-6">
                <p className="text-xl md:text-2xl font-medium text-white max-w-2xl">
                  Promote the small business way with local partnerships.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default POSAdvertising;