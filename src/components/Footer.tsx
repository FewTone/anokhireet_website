import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-[#f8eee6] py-10 px-5 mt-16">
            <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-8">
                    More about shopping At Snitch for men
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-5 max-w-[1400px] mx-auto text-left">
                    {/* Top Categories */}
                    <div>
                        <h4 className="text-sm font-bold mb-2">TOP CATEGORIES</h4>
                        <ul className="text-[13px] text-[#444]">
                            <li className="mb-2 cursor-pointer">T-shirts</li>
                            <li className="mb-2 cursor-pointer">Bags</li>
                            <li className="mb-2 cursor-pointer">Co-ords</li>
                            <li className="mb-2 cursor-pointer">Shoes</li>
                        </ul>
                    </div>
                    <div>
                        <ul className="text-[13px] text-[#444] mt-6 lg:mt-0">
                            <li className="mb-2 cursor-pointer">Shirts</li>
                            <li className="mb-2 cursor-pointer">Accessories</li>
                            <li className="mb-2 cursor-pointer">Hoodies</li>
                            <li className="mb-2 cursor-pointer">Sunglasses</li>
                        </ul>
                    </div>
                    <div>
                        <ul className="text-[13px] text-[#444]">
                            <li className="mb-2 cursor-pointer">Joggers</li>
                            <li className="mb-2 cursor-pointer">Belts</li>
                            <li className="mb-2 cursor-pointer">Jackets</li>
                            <li className="mb-2 cursor-pointer">Jeans</li>
                        </ul>
                    </div>
                    <div>
                        <ul className="text-[13px] text-[#444]">
                            <li className="mb-2 cursor-pointer">Shorts</li>
                            <li className="mb-2 cursor-pointer">Blazers</li>
                            <li className="mb-2 cursor-pointer">Boxers</li>
                            <li className="mb-2 cursor-pointer">Night Suit & Pyjamas</li>
                        </ul>
                    </div>
                    <div>
                        <ul className="text-[13px] text-[#444]">
                            <li className="mb-2 cursor-pointer">Trousers</li>
                            <li className="mb-2 cursor-pointer">Sweatshirts & Hoodies</li>
                            <li className="mb-2 cursor-pointer">Cargo Pants</li>
                            <li className="mb-2 cursor-pointer">Overshirt</li>
                        </ul>
                    </div>
                    <div>
                        <ul className="text-[13px] text-[#444]">
                            <li className="mb-2 cursor-pointer">Sweaters</li>
                            <li className="mb-2 cursor-pointer">Chinos</li>
                            <li className="mb-2 cursor-pointer">Perfumes</li>
                        </ul>
                    </div>
                </div>

                {/* Popular Searches */}
                <h4 className="text-sm font-bold mt-10 text-center">
                    POPULAR SEARCHES
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1400px] mx-auto mt-4 text-[13px] text-[#444] text-left">
                    <ul>
                        <li>shirts for men</li>
                        <li>hoodie</li>
                        <li>polo t-shirts for men</li>
                        <li>trousers for men</li>
                        <li>branded shirts for men</li>
                    </ul>

                    <ul>
                        <li>jackets for men</li>
                        <li>joggers for men</li>
                        <li>formal trousers for men</li>
                        <li>cargo jeans</li>
                        <li>boutiques near me</li>
                    </ul>

                    <ul>
                        <li>t-shirts for men</li>
                        <li>baggy jeans mens</li>
                        <li>sweatshirt</li>
                        <li>oversized shirt</li>
                        <li>check shirt for men</li>
                    </ul>

                    <ul>
                        <li>cargo</li>
                        <li>straight fit jeans</li>
                        <li>white shirt for men</li>
                        <li>denim</li>
                        <li>casual shirts for men</li>
                    </ul>
                </div>
            </div>

            <div className="mt-12 border-t border-[#ddd] pt-5">
                <div className="flex justify-center gap-4 text-xs flex-wrap mb-4 px-2">
                    <span className="cursor-pointer">About Us</span>
                    <span className="cursor-pointer">Privacy Policy</span>
                    <span className="cursor-pointer">Terms & Conditions</span>
                    <span className="cursor-pointer">Return/Exchange Policy</span>
                    <span className="cursor-pointer">Contact Us</span>
                    <span className="cursor-pointer">Sitemap</span>
                    <span className="cursor-pointer">Stakeholders</span>
                </div>

                <div className="flex justify-center gap-4">
                    <span className="cursor-pointer">
                        <Image
                            src="https://img.icons8.com/?size=100&id=118497&format=png&color=000000"
                            alt="fb"
                            width={24}
                            height={24}
                        />
                    </span>
                    <span className="cursor-pointer">
                        <Image
                            src="https://img.icons8.com/?size=100&id=Xy10Jcu1L2Su&format=png&color=000000"
                            alt="insta"
                            width={24}
                            height={24}
                        />
                    </span>
                    <span className="cursor-pointer">
                        <Image
                            src="https://img.icons8.com/?size=100&id=13930&format=png&color=000000"
                            alt="linkedin"
                            width={24}
                            height={24}
                        />
                    </span>
                    <span className="cursor-pointer">
                        <Image
                            src="https://img.icons8.com/?size=100&id=60984&format=png&color=000000"
                            alt="twitter"
                            width={24}
                            height={24}
                        />
                    </span>
                </div>
            </div>
        </footer>
    );
}
