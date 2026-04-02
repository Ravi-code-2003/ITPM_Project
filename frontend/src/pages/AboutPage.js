import React from 'react';
import { Users, Target, Award, Heart } from 'lucide-react';
import Card, { CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-gray-100 mb-4">
            About UniCore
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Connecting students with essential campus services and opportunities to enhance their university experience.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 shadow-soft-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-primary dark:text-gray-100 mb-4">Our Mission</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  To create a comprehensive platform that simplifies student life by connecting them with verified
                  local services, accommodation options, and educational opportunities.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  We believe that students should focus on their studies while having easy access to quality
                  services that support their academic journey.
                </p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/5 rounded-xl p-8">
                <Target className="h-16 w-16 text-primary dark:text-accent mb-4" />
                <h3 className="text-xl font-semibold text-primary dark:text-gray-100 mb-2">Our Goal</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  To become the most trusted platform for student services across universities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center shadow-soft-xl" hover>
            <CardContent className="p-8">
              <Users className="h-12 w-12 text-primary dark:text-accent mx-auto mb-4" />
              <CardTitle className="mb-4">Community First</CardTitle>
              <CardDescription>
                Building a strong community of students and service providers who support each other.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center shadow-soft-xl" hover>
            <CardContent className="p-8">
              <Award className="h-12 w-12 text-primary dark:text-accent mx-auto mb-4" />
              <CardTitle className="mb-4">Quality Assured</CardTitle>
              <CardDescription>
                All service providers are verified to ensure students get quality services they can trust.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center shadow-soft-xl" hover>
            <CardContent className="p-8">
              <Heart className="h-12 w-12 text-primary dark:text-accent mx-auto mb-4" />
              <CardTitle className="mb-4">Student-Centered</CardTitle>
              <CardDescription>
                Every feature is designed with students' needs and budget constraints in mind.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <Card className="!bg-primary dark:!bg-primary text-white text-center shadow-soft-xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-4 text-white">Our Story</h2>
            <p className="text-lg text-white/90 max-w-4xl mx-auto">
              UniCore was founded by university students who experienced the challenges of finding reliable
              services near campus. We created this platform to help every student have a smoother, more connected
              university experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
