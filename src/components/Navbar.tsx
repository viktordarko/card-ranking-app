import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-white text-lg font-bold">Card Ranking App</h1>
                <div>
                    <Link href="/" className="text-white px-4">Home</Link>
                    <Link href="/cards" className="text-white px-4">Cards</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;