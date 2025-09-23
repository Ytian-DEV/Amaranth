import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Mail, Phone, User } from "lucide-react";

export function EditorialBoardPage() {
  const editorialBoard = [
    {
      name: "Anna Marie Naagas",
      position: "Executive Editor",
      year: "4th Year, BSed English",
      email: "annamarie.amaranth@vsu.edu.ph",
      bio: "Anna leads the editorial team with over 3 years of experience in student journalism. She specializes in investigative reporting and has won several awards for her work on campus issues.",
      image: "/images/editorial-board/anna-naagas.jpg"
    },
    {
      name: "Jelly Mondejar",
      position: "Managing Editor",
      year: "3rd Year, BS Agricultural & Biosystems Engineering",
      email: "jellyrosemondejar7@gmail.com",
      bio: "Jelly oversees the daily operations of the publication and manages content workflow. He has a passion for literary journalism and feature writing.",
      image: "/images/editorial-board/jelly-mondejar.jpg"
    },
    {
      name: "Chubi Soliva",
      position: "Business Manager",
      year: "2nd Year, BS Developmental Communication",
      email: "soliva.chubi@gmail.com",
      bio: "Chubi manages the business operations and finances of the publication. He has a background in marketing and is passionate about promoting student initiatives.",
      image: "/images/editorial-board/chubi-soliva.jpg"
    },
    {
      name: "Xavier John Villaruel",
      position: "Editorial Consultant",
      year: "6th Year, BS Veterinary Medicine",
      email: "xaviervillaruel.xv@gmail.com",
      bio: "Xavier provides expert advice on editorial content and strategy. He has a strong background in media studies and is dedicated to enhancing the publication's quality.",
      image: "/images/editorial-board/xavier-villaruel.jpg"
    }
  ];

  const sectionHeads = [
    {
      name: "Fred Vincent Marfori",
      position: "News Editor",
      year: "4th Year, BS Veterinary Medicine",
      email: "fredvincentmarfori@gmail.com",
      bio: "News Editor managing the news section and editorial content.",
      image: "/images/section-heads/fred-marfori.jpg"
    },
    {
      name: "Sean Marcus David",
      position: "Opinion Editor",
      year: "3rd Year, BS Veterinary Medicine",
      email: "smv12david@gmail.com",
      bio: "Opinion Editor managing the opinion section and editorial content.",
      image: "/images/section-heads/sean-david.jpg"
    },
    {
      name: "Rixel Rashid Manimtim",
      position: "Feature Editor",
      year: "Unknown",
      email: "manimtim.rixel.espejo@gmail.com",
      bio: "Feature Editor managing the feature section and editorial content.",
      image: "/images/section-heads/rixel-manimtim.jpg"
    },
    {
      name: "Mariah Shacille Jade Montesclaros",
      position: "Literary Editor",
      year: "BSEd-Math 2",
      email: "mariahshacillejademontesclaros@gmail.com",
      bio: "Literary Editor overseeing poetry, short stories, and creative pieces from the VSU community.",
      image: "/images/section-heads/mariah-montesclaros.jpg"
    },
    {
      name: "Joshua Pray Calacar",
      position: "Sci-Tech Editor",
      year: "BS Biotechnology - 4",
      email: "joshuapreycalacar@gmail.com",
      bio: "Sci-Tech Editor covering science and technology news and developments.",
      image: "/images/section-heads/joshua-calacar.jpg"
    },
    {
      name: "Frances Ibo",
      position: "Sports Editor",
      year: "BS Development Communication - 4",
      email: "francesibo3@gmail.com",
      bio: "Sports Editor covering all sports activities and athletic events on campus.",
      image: "/images/section-heads/frances-ibo.jpg"
    },
    {
      name: "Sam Christian Duco",
      position: "Creatives and Design Head",
      year: "BS Development Communication - 2",
      email: "ducosamchristian@gmail.com",
      bio: "Creatives and Design Head responsible for visual layout and design elements.",
      image: "/images/section-heads/sam-duco.jpg"
    },
    {
      name: "Kaye Bianca Banares",
      position: "Visual Editor",
      year: "BS Meteorology - 3",
      email: "banareskayebianca@gmail.com",
      bio: "Visual Editor managing visual content and artistic direction.",
      image: "/images/section-heads/kaye-banares.jpg"
    },
    {
      name: "Christian Earl James Boyles",
      position: "Multimedia Production Head",
      year: "BS Computer Science - 3",
      email: "christianboyles0143@gmail.com",
      bio: "Multimedia Production Head overseeing digital content and production workflow.",
      image: "/images/section-heads/christian-boyles.jpg"
    },
    {
      name: "Jyra Maria Usaraga",
      position: "Head Photo Editor",
      year: "Doctor of Veterinary Medicine- 4",
      email: "jyramaria@gmail.com",
      bio: "Head Photo Editor leading the photography team and managing visual content.",
      image: "/images/section-heads/jyra-usaraga.jpg"
    },
    {
      name: "Shamel Tejones",
      position: "Head Video Editor",
      year: "BS Mechanical Engineering - 4",
      email: "tejonesshamelnoble@gmail.com",
      bio: "Head Video Editor managing video content production and editing.",
      image: "/images/section-heads/shamel-tejones.jpg"
    },
    {
      name: "Jennifer Jezreel Kaye Pading",
      position: "Online Editor",
      year: "BSEcon 2",
      email: "jenniferpading28@gmail.com",
      bio: "Online Editor managing digital content and online publication platforms.",
      image: "/images/section-heads/jennifer-pading.jpg"
    }
  ];

  const advisers = [
    {
      name: "Dr. Ulderico A. Alviola",
      position: "Adviser",
      department: "Department of Developmental Communication",
      email: "ulderico.alviola@vsu.edu.ph",
      bio: "Dr. Alviola guides the publication with his extensive experience in journalism and media. He ensures editorial quality and ethical standards.",
      image: "/images/advisers/ulderico-alviola.jpg"
    },

    {
      name: "Dr. Jucel Marie Guatlo",
      position: "Adviser",
      department: "Department of Agricultural and Biosystems Engineering",
      email: "jmarieguatlo@vsu.edu.ph",
      bio: "Dr. Guatlo guides the publication with her extensive experience in journalism and media. She ensures editorial quality and ethical standards.",
      image: "/images/advisers/jucel-marie-guatlo.jpg"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Amaranth Organization Board</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Meet the dedicated team behind Amaranth - passionate students and faculty committed to 
          excellence in journalism and serving the VSU community.
        </p>
      </div>

      {/* Advisers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-emerald-700">Advisers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advisers.map((adviser, index) => (
            <Card key={index} className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                    {adviser.image ? (
                      <img 
                        src={adviser.image} 
                        alt={adviser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-emerald-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{adviser.name}</CardTitle>
                    <Badge className="bg-emerald-700 text-white mt-1">
                      {adviser.position}
                    </Badge>
                    {adviser.department && (
                      <p className="text-sm text-muted-foreground mt-1">{adviser.department}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{adviser.bio}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Mail className="w-4 h-4" />
                    {adviser.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Editorial Board */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-emerald-700">Editorial Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editorialBoard.map((member, index) => (
            <Card key={index} className="border-emerald-200">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-emerald-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 mt-1">
                      {member.position}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{member.year}</p>
                <p className="text-sm">{member.bio}</p>
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Mail className="w-4 h-4" />
                  {member.email}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Heads */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-emerald-700">Section Heads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {sectionHeads.map((member, index) => (
            <Card key={index} className="border-emerald-200">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-emerald-700" />
                    )}
                  </div>
                  <div className="flex-5">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-xs">
                      {member.position}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{member.year}</p>
                <p className="text-sm">{member.bio}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Mail className="w-3 h-3" />
                    <span className="text-xs">{member.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-emerald-700">Join Our Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Interested in joining Amaranth? We are looking for passionate students who want to contribute to campus journalism.
          </p>
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Mail className="w-4 h-4" />
            Contact us at:{" "}
            <a 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=amaranth@vsu.edu.ph&su=Joining%20Amaranth%20Team&body=Hello%20Amaranth%20Team,%0A%0AI%20am%20interested%20in%20joining%20your%20editorial%20team.%0A%0AHere%20is%20a%20brief%20introduction%20about%20myself:%0A%0A"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 underline hover:underline-offset-2 transition-colors"
            >
              amaranth@vsu.edu.ph
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}