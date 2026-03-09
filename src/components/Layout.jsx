import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';



const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-h-screen w-full transition-all duration-300">
                {/* Navbar - sticky top-0 keeps it pinned while page scrolls */}
                <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                {/* Page Content */}
                <main className="flex-grow p-4 md:p-6 lg:p-8">
                    {children}
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default Layout;
