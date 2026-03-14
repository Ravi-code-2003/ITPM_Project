import React, { useState } from 'react';
import { BookOpen, Clock, Users, Star, Search, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const EducationProgramsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const programs = [
    {
      id: 1,
      title: "Web Development Bootcamp",
      category: "Technology",
      provider: "TechEd Academy",
      duration: "12 weeks",
      level: "Beginner to Intermediate",
      rating: 4.8,
      students: 245,
      price: "LKR 299",
      description: "Learn modern web development with React, Node.js, and MongoDB. Build real projects and get job-ready skills.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
      tags: ["React", "Node.js", "MongoDB", "JavaScript"]
    },
    {
      id: 2,
      title: "Digital Marketing Fundamentals",
      category: "Business",
      provider: "Marketing Pro Institute",
      duration: "8 weeks",
      level: "Beginner",
      rating: 4.6,
      students: 189,
      price: "LKR 199",
      description: "Master digital marketing strategies including SEO, social media marketing, and content creation.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
      tags: ["SEO", "Social Media", "Content Marketing", "Analytics"]
    },
    {
      id: 3,
      title: "Data Science with Python",
      category: "Technology",
      provider: "Data Science Hub",
      duration: "16 weeks",
      level: "Intermediate",
      rating: 4.9,
      students: 312,
      price: "LKR 399",
      description: "Comprehensive data science course covering Python, machine learning, and data visualization.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
      tags: ["Python", "Machine Learning", "Data Analysis", "Visualization"]
    },
    {
      id: 4,
      title: "Graphic Design Mastery",
      category: "Design",
      provider: "Creative Studio",
      duration: "10 weeks",
      level: "Beginner",
      rating: 4.7,
      students: 156,
      price: "LKR 249",
      description: "Learn professional graphic design using Adobe Creative Suite. Create logos, branding, and marketing materials.",
      image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=250&fit=crop",
      tags: ["Photoshop", "Illustrator", "Branding", "Typography"]
    },
    {
      id: 5,
      title: "Financial Planning Basics",
      category: "Finance",
      provider: "Money Management Academy",
      duration: "6 weeks",
      level: "Beginner",
      rating: 4.5,
      students: 98,
      price: "LKR 149",
      description: "Essential financial planning skills for students and young professionals. Budgeting, investing, and saving strategies.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
      tags: ["Budgeting", "Investing", "Savings", "Personal Finance"]
    },
    {
      id: 6,
      title: "Mobile App Development",
      category: "Technology",
      provider: "App Dev Institute",
      duration: "14 weeks",
      level: "Intermediate",
      rating: 4.8,
      students: 203,
      price: "LKR 349",
      description: "Build iOS and Android apps using React Native. From concept to app store deployment.",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
      tags: ["React Native", "iOS", "Android", "Mobile Development"]
    }
  ];

  const categories = ["All", "Technology", "Business", "Design", "Finance"];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || program.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-gray-100 mb-4">
            Education Programs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover skill-building courses and programs to enhance your career prospects and personal development.
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8 shadow-soft-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-secondary/30 dark:border-secondary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-[#1E2233] text-primary dark:text-gray-100"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <Card key={program.id} hover className="overflow-hidden shadow-soft-xl">
              <div className="relative">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                    {program.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-white bg-opacity-90 text-primary px-2 py-1 rounded-full text-sm font-bold">
                    {program.price}
                  </span>
                </div>
              </div>

              <CardContent className="p-6">
                <CardTitle className="mb-2">{program.title}</CardTitle>
                <CardDescription className="mb-4 line-clamp-2">{program.description}</CardDescription>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-accent fill-current" />
                    <span className="ml-1 text-sm font-medium text-primary dark:text-gray-200">{program.rating}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    {program.students} students
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Provider: {program.provider}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    Duration: {program.duration}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Level: {program.level}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {program.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-accent/10 dark:bg-accent/5 text-primary dark:text-gray-300 px-2 py-1 rounded-md text-xs">
                      {tag}
                    </span>
                  ))}
                  {program.tags.length > 3 && (
                    <span className="text-xs text-gray-600 dark:text-gray-500">+{program.tags.length - 3} more</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button fullWidth>
                    Enroll Now
                  </Button>
                  <Button variant="outline" className="px-4">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary dark:text-gray-100 mb-2">No programs found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria or browse all programs.</p>
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-16 !bg-primary dark:!bg-primary text-white text-center shadow-soft-xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-4 text-white">Want to Offer a Program?</h2>
            <p className="text-xl text-white/90 mb-6">
              Join our platform as an education provider and reach thousands of eager students.
            </p>
            <Button variant="secondary" size="lg">
              Become a Provider
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EducationProgramsPage;
