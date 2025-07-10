import React from 'react';
import { Button } from '../components/ui';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const HomePage: React.FC = () => {
  return (
    <>
      {/* Hero Section - Mobile First */}
      <section className="hero hero-musical is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <div className="columns is-centered">
              <div className="column is-full-mobile is-10-tablet is-8-desktop">
                <h1 className="title is-3-mobile is-2-tablet is-1-desktop has-text-white mb-4 mb-6-tablet">
                  Welcome to <span className="musical-accent">ChoirApp</span>
                </h1>
                <h2 className="subtitle is-5-mobile is-4-tablet is-3-desktop has-text-white-ter mb-5 mb-6-tablet">
                  Your comprehensive digital platform for choir management, 
                  song organization, and seamless musical collaboration.
                </h2>
                <div className="buttons is-centered">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
                    className="mb-3 is-fullwidth-mobile mr-0-mobile mr-4-tablet"
                  >
                    🎵 Sign In with Google
                  </Button>
                  <Button
                    variant="outlined"
                    size="sm"
                    className="has-text-white is-fullwidth-mobile"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="hero-foot">
          <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#f9fafb" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section - Mobile First */}
      <section className="section py-4 py-6-tablet">
        <div className="container">
          <div className="has-text-centered mb-5 mb-6-tablet">
            <h2 className="title is-3-mobile is-2-tablet text-primary">Why Choose ChoirApp?</h2>
            <p className="subtitle is-5-mobile is-4-tablet text-secondary px-3 px-0-tablet">
              Everything you need to manage your choir in one beautiful platform
            </p>
          </div>
          
          <div className="columns is-multiline is-mobile">
            <div className="column is-full-mobile is-half-tablet is-one-third-desktop">
              <div className="card has-text-centered p-4 p-5-tablet">
                <div className="card-content">
                  <div className="mb-3 mb-4-tablet">
                    <span className="icon is-large text-accent">
                      <i className="fas fa-users fa-2x fa-3x-tablet"></i>
                    </span>
                  </div>
                  <h3 className="title is-5-mobile is-4-tablet">Choir Management</h3>
                  <p className="content is-size-6-mobile">
                    Easily manage your choir members, roles, and permissions. 
                    Send invitations and organize your musical community.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="column is-full-mobile is-half-tablet is-one-third-desktop">
              <div className="card has-text-centered p-4 p-5-tablet">
                <div className="card-content">
                  <div className="mb-3 mb-4-tablet">
                    <span className="icon is-large text-accent">
                      <i className="fas fa-music fa-2x fa-3x-tablet"></i>
                    </span>
                  </div>
                  <h3 className="title is-5-mobile is-4-tablet">Song Library</h3>
                  <p className="content is-size-6-mobile">
                    Comprehensive song database with ChordPro support. 
                    Create choir-specific versions and manage your repertoire.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="column is-full-mobile is-half-tablet is-one-third-desktop">
              <div className="card has-text-centered p-4 p-5-tablet">
                <div className="card-content">
                  <div className="mb-3 mb-4-tablet">
                    <span className="icon is-large text-accent">
                      <i className="fas fa-list-alt fa-2x fa-3x-tablet"></i>
                    </span>
                  </div>
                  <h3 className="title is-5-mobile is-4-tablet">Smart Playlists</h3>
                  <p className="content is-size-6-mobile">
                    Create dynamic playlists for services and events. 
                    Use templates and organize songs by sections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Mobile First */}
      <section className="section gradient-primary py-5 py-6-tablet">
        <div className="container">
          <div className="has-text-centered">
            <h2 className="title is-3-mobile is-2-tablet has-text-white">Ready to Get Started?</h2>
            <p className="subtitle is-5-mobile is-4-tablet has-text-white-ter mb-4 mb-5-tablet px-3 px-0-tablet">
              Join thousands of choir directors already using ChoirApp
            </p>
            <Button
              variant="accent"
              size="md"
              onClick={() => window.location.href = `${API_BASE_URL}/api/auth/signin-google`}
              className="is-fullwidth-mobile"
            >
              Start Your Musical Journey
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
