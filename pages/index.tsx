import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Mail, Coffee, ExternalLink, Star, Code, Sparkles, ChevronDown, Menu, X, RefreshCw } from "lucide-react";

type Repo = {
  name: string;
  html_url: string;
  description: string;
  language: string;
  stargazers_count: number;
};

type CategorizedRepos = {
  robotics: Repo[];
  aiMl: Repo[];
  appWeb: Repo[];
};

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [categorizedRepos, setCategorizedRepos] = useState<CategorizedRepos>({
    robotics: [],
    aiMl: [],
    appWeb: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  const PROJECTS_ENDPOINT = `${API_BASE}/api/projects`;

  const loadProjects = async () => {
    let mounted = true;
    setRefreshing(true);
    setError(null);
    
    try {
      // Add a small delay to show loading state properly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!mounted) return;

      console.log("Fetching projects from:", PROJECTS_ENDPOINT);
      const r = await axios.get(PROJECTS_ENDPOINT, { 
        timeout: 15000, // Increased timeout for slow backend
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!mounted) return;

      const data: Repo[] = r.data;
      console.log("Received projects:", data.length);

      // Process data asynchronously to prevent blocking
      await processReposData(data);

    } catch (e: any) {
      console.error("Failed to load projects:", e);
      if (!mounted) return;
      
      if (e.code === 'ECONNABORTED') {
        setError("Request timeout - backend is taking too long to respond. Please try again.");
      } else if (e.response?.status === 503) {
        setError("Backend service is temporarily unavailable. Please try again in a few moments.");
      } else {
        setError("Cannot load projects. Make sure backend is running.");
      }
    } finally {
      if (mounted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  async function processReposData(data: Repo[]) {
    return new Promise<void>((resolve) => {
      // Use setTimeout to break up the processing and keep UI responsive
      setTimeout(() => {
        const categorizeRepo = (repo: Repo) => {
          const name = repo.name.toLowerCase();
          const desc = (repo.description || "").toLowerCase();
          const text = name + " " + desc;

          // EXCLUDE THESE FROM ROBOTICS (they should go to appWeb)
          const excludeFromRobotics = [
            /arka.?portfolio.?frontend/i,
            /portfolio.?frontend/i,
            /frontend/i,
            /next\.?js/i,
            /typescript/i,
            /portfolio/i
          ];

          // Check if it should be excluded from robotics first
          const shouldExcludeFromRobotics = excludeFromRobotics.some(regex => 
            regex.test(name) || regex.test(desc)
          );

          if (shouldExcludeFromRobotics) {
            return 'appWeb';
          }

          // ROBOTICS - High confidence terms only
          const roboticsTerms = [
            /ros[2]?/i,
            /moveit[2]?/i,
            /nav2/i,
            /slam/i,
            /dwa/i,
            /aruco/i,
            /gazebo/i,
            /turtlebot/i,
            /urdf/i,
            /xacro/i,
            /tf2/i,
            /canbus/i,
            /can\-bus/i,
            /kinematic/i,
            /manipulator/i,
            /gripper/i,
            /navigation/i,
            /mapping/i,
            /localization/i,
            /odom/i,
            /imu/i,
            /pointcloud/i,
            /lidar/i,
            /autonomous.?explorer/i,
            /autonomous.?mapper/i,
            /rover/i,
            /jetson/i,
            /embedded/i
          ];
          
          const hasRobotics = roboticsTerms.some(regex => 
            regex.test(name) || regex.test(desc)
          );

          if (hasRobotics) {
            return 'robotics';
          }

          // AI/ML - Medium confidence
          const aiMlTerms = [
            /ai\b/i,
            /ml\b/i,
            /machine.?learning/i,
            /artificial.?intelligence/i,
            /neural.?network/i,
            /deep.?learning/i,
            /llm/i,
            /langchain/i,
            /chatbot/i,
            /rag/i,
            /transformer/i,
            /gpt/i,
            /bert/i,
            /language.?model/i,
            /cnn/i,
            /rnn/i,
            /lstm/i,
            /gru/i,
            /yolo/i,
            /detectron/i,
            /object.?detection/i,
            /segmentation/i,
            /classification/i,
            /tensorflow/i,
            /pytorch/i,
            /keras/i,
            /scikit/i,
            /computer.?vision/i,
            /nlp/i,
            /natural.?language/i,
            /face.?recognition/i,
            /facial.?recognition/i
          ];
          
          const hasAiMl = aiMlTerms.some(regex => 
            regex.test(name) || regex.test(desc)
          );

          if (hasAiMl) {
            return 'aiMl';
          }

          // Everything else goes to Apps & Web
          return 'appWeb';
        };

        const sortRepos = (repoList: Repo[], category: keyof CategorizedRepos) => {
          return [...repoList].sort((a, b) => {
            const score = (repo: Repo) => {
              const name = repo.name.toLowerCase();
              const desc = (repo.description || "").toLowerCase();
              const text = name + " " + desc;
              let s = 0;

              s += repo.stargazers_count * 100;

              if (category === 'appWeb') {
                // HIGHEST PRIORITY: Chat applications and real-time apps
                if (/chat|messaging|real.?time|socket/i.test(text)) s += 1000;
                if (/chatapp|chat.?app|whatsapp|telegram|slack/i.test(name)) s += 1200;
                
                // HIGH PRIORITY: Portfolio projects
                if (/portfolio.?frontend|arka.?portfolio/i.test(text)) s += 900;
                if (/portfolio.?backend|fastapi.?backend/i.test(text)) s += 850;
                
                // HIGH PRIORITY: Complex systems
                if (/college.?management|management.?system|protocol.?system/i.test(text)) s += 800;
                
                // HIGH PRIORITY: Complete applications
                if (/full.?stack|mern|mean|complete.?app/i.test(text)) s += 700;
                
                // MEDIUM PRIORITY: Modern frameworks
                if (/next\.?js|typescript|react/i.test(text)) s += 600;
                if (/flutter|dart|mobile.?app/i.test(text)) s += 550;
                
                // LOWER PRIORITY: Simple utilities (reduced priority)
                if (/url.?shortener|url.?short|shortener/i.test(text)) s += 300; // Reduced from 600
                if (/web.?service|library.?and.?web/i.test(text)) s += 400;
                if (/weather.?website|weather/i.test(text)) s += 250;
                
                // MODERN WEB TECHNOLOGIES
                if (/node\.?js|express|javascript/i.test(text)) s += 200;
                if (/html|css|web/i.test(text)) s += 150;
                
                // BACKEND & APIs
                if (/api|rest|graphql|server/i.test(text)) s += 100;
                if (/python|django|flask|fastapi/i.test(text)) s += 80;
                
                // DEMOTE: Practice, tutorials, generic projects
                if (/first|tutorial|beginner/i.test(text)) s -= 400;
                if (/practice|prac|assignment|problem/i.test(text)) s -= 300;
                if (/webscrap|scraping|extractor/i.test(text)) s -= 200;
                if (/encoder|decoder/i.test(text)) s -= 100;
              }
              
              if (category === 'aiMl') {
                if (/chatbot|llm|gpt|language.?model/i.test(text)) s += 300;
                if (/face.?recognition|facial/i.test(text)) s += 250;
                if (/attendance.?system/i.test(text)) s += 200;
                if (repo.stargazers_count > 0) s += 150;
                if (/tensorflow|pytorch|opencv/i.test(text)) s += 100;
                if (/jupyter|notebook/i.test(text)) s += 50;
              }
              
              if (category === 'robotics') {
                s += 1000; // Base score for all robotics
                if (/autonomous.?explorer|slam|nav2/i.test(text)) s += 600;
                if (/canbus|can\-bus|driver|motor/i.test(text)) s += 300;
                if (/local.?planner|dwa/i.test(text)) s += 200;
                s += repo.stargazers_count * 50;
                if (/pubsub|int.?pubsub|demo|example/i.test(text)) s -= 100;
              }
              
              // QUALITY INDICATORS
              if (repo.description && repo.description.length > 30) s += 200;
              if (repo.language && repo.language !== "Unknown") s += 100;
              
              return s;
            };

            return score(b) - score(a);
          });
        };

        const categorized: CategorizedRepos = {
          robotics: [],
          aiMl: [],
          appWeb: []
        };

        data.forEach(repo => {
          const category = categorizeRepo(repo);
          categorized[category].push(repo);
        });

        // Sort each category
        categorized.robotics = sortRepos(categorized.robotics, 'robotics');
        categorized.aiMl = sortRepos(categorized.aiMl, 'aiMl');
        categorized.appWeb = sortRepos(categorized.appWeb, 'appWeb');

        setRepos(data);
        setCategorizedRepos(categorized);
        resolve();
      }, 100);
    });
  }

  const projects = [
    {
      title: "Autonomous Mars Rover",
      subtitle: "ROS 2 + NVIDIA Jetson",
      desc: "Rover platform: navigation, CV pipeline, and manipulator control (onboard Jetson).",
      url: null,
      tags: ["ROS 2", "Jetson", "Computer Vision"]
    },
    {
      title: "Autonomous Explorer & Mapper",
      subtitle: "ROS 2",
      desc: "SLAM + Nav2 prototype (tested in TurtleBot3 sim).",
      url: "https://github.com/AniArka/Autonomous-Explorer-and-Mapper-ros2-nav2",
      tags: ["SLAM", "Nav2", "TurtleBot3"]
    },
    {
      title: "Rover Arm",
      subtitle: "MoveIt 2 + ROS 2",
      desc: "Pick-and-place and soil sampling workflows using MoveIt 2.",
      url: null,
      tags: ["MoveIt 2", "Manipulation", "ROS 2"]
    },
    {
      title: "WebShare CAN Driver",
      subtitle: "ROS 2 USB-to-CAN",
      desc: "USB-CAN driver layer connecting microcontrollers to ROS 2 nodes.",
      url: "https://github.com/AniArka/ros2_waveshare_canb",
      tags: ["CAN Bus", "ROS 2", "Drivers"]
    },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const RepoSection = ({ title, repos, icon, gradient }: { title: string, repos: Repo[], icon: any, gradient: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className={`flex items-center mb-6 pb-4 border-b ${gradient}`}>
        {icon}
        <h3 className="text-2xl font-bold text-white ml-3">
          {title}
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {repos.slice(0, 4).map((r, idx) => (
          <motion.div
            key={r.html_url}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-500/20"
            onClick={() => window.open(r.html_url, "_blank")}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-semibold group-hover:text-cyan-400 transition flex items-center">
                <Code className="w-4 h-4 mr-2" />
                {r.name}
              </h4>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition" />
            </div>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {r.description || "No description available."}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-gray-800/80 px-3 py-1 rounded-full text-gray-300 font-medium">
                {r.language || "Unknown"}
              </span>
              <span className="flex items-center text-yellow-400">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {r.stargazers_count}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      {repos.length > 4 && (
        <div className="text-center mt-6">
          <span className="text-cyan-400 text-sm font-medium">
            +{repos.length - 4} more projects in this category
          </span>
        </div>
      )}
      {repos.length === 0 && (
        <p className="text-gray-500 text-sm italic text-center py-8">No projects in this category</p>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AG</span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {['home', 'about', 'projects', 'github'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`text-sm font-medium transition ${
                  activeSection === item 
                    ? 'text-cyan-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-gray-900 border-t border-gray-800"
            >
              <div className="px-6 py-4 space-y-3">
                {['home', 'about', 'projects', 'github'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="block w-full text-left text-gray-300 hover:text-cyan-400 transition py-2"
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-cyan-500/50">
                AG
              </div>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Arka Ghosh
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Robotics & Autonomous Systems Developer
            </p>
            <p className="text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed text-lg">
              Building intelligent systems that perceive, plan, and act. Specialized in ROS 2, AI-driven autonomy, and cutting-edge robotics solutions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:arkaghosh0115@gmail.com"
                className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition font-medium"
              >
                <Mail className="w-5 h-5 mr-2" />
                Get in Touch
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com/AniArka"
                target="_blank"
                rel="noreferrer"
                className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-medium border border-gray-700"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </motion.a>
              {/* <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://www.buymeacoffee.com/yourname"
                target="_blank"
                rel="noreferrer"
                className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition font-medium"
              >
                <Coffee className="w-5 h-5 mr-2" />
                Buy me a coffee
              </motion.a> */}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-16"
            >
              <ChevronDown className="w-8 h-8 mx-auto text-cyan-400 animate-bounce" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-20 relative z-10">
        {/* About Section */}
        <section id="about" className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              About Me
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              I build intelligent robotic systems that perceive, plan, and act.
              Focused on ROS 2 navigation, manipulation, AI-driven autonomy, and LLM-powered tools.
              Passionate about creating solutions that bridge the gap between robotics and real-world applications.
            </p>
          </motion.div>
        </section>

        {/* Featured Projects */}
        <section id="projects" className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Featured Projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  onClick={() => p.url ? window.open(p.url, "_blank") : setModal(p.title)}
                  className="group relative p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl cursor-pointer border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition mb-1">
                          {p.title}
                        </h3>
                        <p className="text-sm text-cyan-400 font-medium">{p.subtitle}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition" />
                    </div>
                    
                    <p className="text-gray-400 mb-4 leading-relaxed">{p.desc}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {p.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-800/80 rounded-full text-xs text-cyan-300 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-xs text-cyan-400 mt-4 font-medium flex items-center">
                      {p.url ? (
                        <>View on GitHub <ExternalLink className="w-3 h-3 ml-1" /></>
                      ) : (
                        "Source unavailable"
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <AnimatePresence>
            {modal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-6"
                onClick={() => setModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md border border-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {modal}
                  </h3>
                  <p className="text-lg font-medium text-cyan-400 mb-4">Code Unavailable</p>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    The code for this project cannot be publicly shared due to
                    NDA or proprietary restrictions. You can contact me directly
                    for a technical overview.
                  </p>
                  <button
                    onClick={() => setModal(null)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition font-medium"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* GitHub Projects */}
        <section id="github" className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Live GitHub Projects
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadProjects}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </motion.button>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
                  </div>
                  <span className="text-gray-400 text-lg">Loading projects from backend...</span>
                  <span className="text-gray-500 text-sm">This may take a moment as the backend spins up</span>
                </div>
              )}
              
              {error && (
                <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-xl">
                  <p className="text-red-400 text-center mb-2">{error}</p>
                  <p className="text-gray-400 text-sm text-center mb-4">
                    Backend is deployed on Render and may take a few seconds to respond
                  </p>
                  <div className="text-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadProjects}
                      className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition font-medium mx-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </motion.button>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <div className="space-y-12">
                  <RepoSection 
                    title="Robotics & ROS" 
                    repos={categorizedRepos.robotics} 
                    icon={<div className="text-3xl">🤖</div>}
                    gradient="border-cyan-500/30"
                  />
                  
                  <RepoSection 
                    title="AI & Machine Learning" 
                    repos={categorizedRepos.aiMl} 
                    icon={<div className="text-3xl">🧠</div>}
                    gradient="border-purple-500/30"
                  />
                  
                  <RepoSection 
                    title="Apps & Web Development" 
                    repos={categorizedRepos.appWeb} 
                    icon={<div className="text-3xl">💻</div>}
                    gradient="border-blue-500/30"
                  />
                </div>
              )}

              <div className="text-center mt-10 pt-8 border-t border-gray-700">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://github.com/AniArka"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition font-medium"
                >
                  <Github className="w-5 h-5 mr-2" />
                  View All on GitHub
                </motion.a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* GitHub Contributions */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
              <Github className="w-6 h-6 mr-3 text-cyan-400" />
              GitHub Contributions
            </h2>
            <div className="bg-gray-950/50 rounded-xl p-6 border border-gray-800">
              <img
                src={`https://ghchart.rshah.org/AniArka`}
                alt="GitHub Contributions"
                className="w-full rounded-lg"
              />
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">
              Tracking my coding activity and contributions over time
            </p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Arka Ghosh - Robotics & Autonomous Systems
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://github.com/AniArka" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-cyan-400 transition">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:arkaghosh0115@gmail.com" className="text-gray-400 hover:text-cyan-400 transition">
                <Mail className="w-5 h-5" />
              </a>
              {/* <a href="https://www.buymeacoffee.com/yourname" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-yellow-400 transition">
                <Coffee className="w-5 h-5" />
              </a> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}