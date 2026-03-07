import React from 'react';
import Header from './Header';
import Footer from './Footer';
import StickyNotesBoard from '../notes/StickyNotesBoard';

const Layout = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <StickyNotesBoard />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
