import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Target, Heart, Award } from "lucide-react";

export function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">About Amaranth</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          The official student media organization of Visayas State University.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Target className="w-5 h-5" />
              Preamble
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We, the students of the Visayas State University, imploring the aid and guidance of the Almighty God, in order to form a student media organization that shall embody the true essence of press freedom, commit to responsible and independent campus press, champion the highest standards and ethics of journalism,  uphold the rights of the students and the people and cultivate a free-thinking, well informed, and socially aware studentry through responsible and fearless campus journalism standing on the principles of truth and justice, do hereby ordain and promulgate this Charter.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Heart className="w-5 h-5" />
              Our Mantra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              in the name of TRUTH and standing by it—we remain. AMARANTH.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-emerald-700">Amaranth Charter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Article I */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">DEFINITION OF TERMS</h3>
            <div className="space-y-3">
              <p>Contents of this section are derived from the Campus Journalism Act of 1991 or the Republic Act 7079:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>1. Student Publication</strong> - The issue of any printed material that is independently published by, and which meets the needs and interests of, the studentry;</li>
                <li><strong>2. Student Media Organization</strong> - In essence and definition, an evolved student publication that not only focuses on traditional journalism but also adapts to the demands of the modern media.</li>
                <li><strong>3. Student Journalist</strong> - Any bona fide student enrolled for the current semester or term, who has passed or met the qualification and standards of the editorial board.  He must likewise maintain a satisfactory academic standing.</li>
                <li><strong>4. Editorial Board</strong> - In the tertiary level, the editorial board shall be composed of student journalists who have qualified in placement examinations.  At the tertiary level, the editorial board may include a publication adviser at the option of its members.</li>
                <li><strong>5. Editorial Policies</strong> - A set of guidelines by which a student publication is operated and managed, taking into account pertinent laws as well as the school administration’s policies.  Said guidelines shall determine the frequency of publication, the manner of selecting articles and features and other similar matters.</li>
                <li><strong>6. Board Resolution</strong> - A formal written resolution that formally authorizes the implementation of  decisions made by the Editorial Board, must be anchored on the existing editorial policies and the Amaranth charter.</li>
              </ul>
          </div>

            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE I. DECLARATION OF PRINCIPLES</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> AMARANTH believes in:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>A.</strong> Every person's right to human dignity is the wellspring of press freedom;</li>
                <li><strong>B.</strong> The right to think freely, to obtain and share ideas and information freely—unencumbered, unhampered and unrestricted—is press freedom;</li>
                <li><strong>C.</strong> The right to hold personal opinions and the right to be heard and listened to is press freedom.  Press Freedom, therefore, belongs to the people.</li>
              </ul>
              
              <p><strong>SECTION 2.</strong> AMARANTH believes that the publication should be able to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>A.</strong> Publish news, issues, opinions, and other items directly or indirectly affecting students, whether those matters be of campus, community, nationwide or global scope;</li>
                <li><strong>B.</strong> Provide venue(s) for airing the students’ ideas, questions, demands, grievances and problems and provide the same responses to these matters;</li>
                <li><strong>C.</strong> Expose and train students in the technical and ethical aspects of journalism and media production for their advancement;</li>
                <li><strong>D.</strong> Utilize the student publication in support of sound educational and cultural development of the student, school, community, and country;</li>
                <li><strong>E.</strong> Serve as a pool of the learning experiences of student journalists;</li>
                <li><strong>F.</strong> Establish working links with other student publications and organizations and the professional media;</li>
                <li><strong>G.</strong> Advocate social consciousness and uphold the interests of the Filipino people; and</li>
                <li><strong>H.</strong> Advance students’ rights and responsibilities and promote their general welfare.</li>
              </ul>
              
              <p><strong>SECTION 3.</strong> The AMARANTH reserves the rights and freedom to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>A.</strong> To think freely, to obtain and share ideas and information freely—unencumbered, unhampered and unrestricted;</li>
                <li><strong>B.</strong> To hold personal opinions, be heard and listened to;</li>
                <li><strong>C.</strong> To fully serve the people’s right to know, to publish, to speak out, and to express their individual and collective views and grievances;</li>
                <li><strong>D.</strong> From censorship and curtailment;</li>
                <li><strong>E.</strong> From summary punishment;</li>
                <li><strong>F.</strong> To access public information and documents; and</li>
                <li><strong>G.</strong> Of circulation and continued publication.</li>
              </ul>
            </div>
          </div>

          {/* Article II */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE II. GENERAL PROVISIONS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The official university student media organization of the Visayas State University shall be called the “AMARANTH”.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> The AMARANTH will adapt the identity as the university’s official “student media organization” to complement that of the level of service which it renders to the studentry which has evolved from publications of journalistic nature into publishing and producing journalistic and creative media production across print and digital platforms and media.</li>
                </ul>
              <p><strong>SECTION 2.</strong> The AMARANTH shall uphold the students’ and the people’s inalienable rights to constitute press freedom: the right to inform and the right to be informed.</p>
              <p><strong>SECTION 3.</strong> The AMARANTH, by its nature, is completely independent and autonomous from the University Administration, faculty, University Supreme Student Council, and other organizations inside and outside the campus in terms of planning, implementation, and direction of its program of action, financial appropriations and disbursements, and other aspects involving decision- and policy-making within the publication. No forms of censorship, or pressure inimical to press freedom, from any source, shall be used on it.</p>
              <p><strong>SECTION 4.</strong> There shall be formed an editorial board and staff to oversee the continued operation and circulation of the AMARANTH and they shall conduct themselves and their work according to the highest standards and ethics of journalism.</p>
              <p><strong>SECTION 5.</strong> This charter shall govern the actions of any person or entity connected to the student media organization.</p>
              <p><strong>SECTION 6.</strong> Henceforth, this charter shall be called the “AMARANTH CHARTER.”</p>
            </div>
          </div>

          {/* Article III */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE III. OPERATION</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1. Funding</strong> The university students shall be the publishers of the AMARANTH.  During enrolment period the publication fee of P100 (P100.00 during Summer Term) shall be collected by the University Cashier of duly authorized Collecting Officer of the University and shall deposit the said amount to the special AMARANTH Trust Fund. The AMARANTH Editorial Board and staff shall determine changes from the current publication fee as a response to rising cost of printing and other necessary expenses in consultation with the student body. The changes in funding shall be determined by a council composed of members of the Editorial Board, a representative from the Board of Advisers, a representative from the university Finance and Administrative departments, and the student body through a representative from the University Supreme Student Council. A quorum consists of fifty percent of members plus one shall be the basis of the decision.</p>
              <p><strong>SECTION 2. Budget</strong> At the beginning of the school term, the editorial board and staff shall prepare the AMARANTH budget. Copies of the budget shall be posted on school bulletin boards, furnished to the Internal Audit Service, Accounting, Budget, OVPSAS and USSCF, and published in the student publication. The budget shall include expenses for the printing costs of the student publication, transportation and needs of staff and advisers during the conduct of press work; equipment, office and photo supplies; attendance of AMARANTH representatives at the annual divisional, regional, and national press conferences, congresses and workshops; staff development; honoraria for staffers, adviser(s), additional/emergency labor, and other incidental expenses. The Internal Audit Service and the University Accounting Division shall audit the disbursements of the AMARANTH.</p>
              <p><strong>SECTION 3. Printing</strong> Printing. The editorial board and staff shall observe proper canvass or bidding when contracting a private printer to print the AMARANTH. If the editorial board and staff decide to contract the University Printing Press for the job, payment shall be made through fund transfer.</p>
              <p><strong>SECTION 4. Use of Student Publication Funds.</strong> Publication fees, savings, donations, grants and funds collected from other sources and means for the AMARANTH shall be for its exclusive use. Violation of this provision by the editorial board and staff, adviser(s), and or university administrator(s)/official(s) shall be a valid cause for administrative and or criminal action against the violator/s.</p>
              <p><strong>SECTION 5. Releases and Publications.</strong> The AMARANTH is expected to regularly release a print publication of any but not limited to the following: a Newsletter, Magazine, Broadsheet, Tabloid, Litfolio, or Artfolio, and other special publications in an academic year under normal circumstances.</p>
            </div>
          </div>

          {/* Article IV */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE IV. MEMBERSHIP</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> Applicants for membership to the AMARANTH staff must be a bona fide university student of Visayas State University—college, high school, and post-graduate.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> College and Post-graduate staff shall be identified as members;</li>
                  <li><strong>ii.</strong> High school staff shall be identified as associate-members;</li>
                    <p>Applicants must comply the following:</p>
                    <li><span><strong>a.</strong> A duly filled out application form either printed or online;</span></li>
                    <li><span><strong>b.</strong> Copy of the Certificate of Registration and Identification Card</span></li>
                </ul>
              <p><strong>SECTION 2.</strong> A Screening Committee shall be formed and composed of the following:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Executive Editor, Managing Editor, Business Manager, and Section Editors;</li>
                    <li>A representative from the Board of Advisors; and</li>
                    <li>A Media practitioner or a university faculty in the communication/journalism field.</li>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li><strong>i.</strong> The screening committee shall be responsible for conduct of the screening processes of the applicants.</li>
                      </ul>
                </ul>
              <p><strong>SECTION 3.</strong> Applicants must take the annual screening to be prepared, conducted and supervised by the Screening Committee. This shall be held not later than the first month of the current semester. Current staff shall have the opportunity to interview the applicants. The following processes are to be undergone by the applicants:</p>
              <p><strong>SECTION 4.</strong> The Executive Editor shall select the other members of the editorial board, which are the managing editor, the business manager, and section editors. He/she shall also assign the circulation manager, beat reporters/writers, and artists/photographers for the year and incorporate the names of the newly passed staff into the AMARANTH organizational setup. The year/s new AMARANTH organizational setup shall be endorsed to the University President for recognition and acknowledgment (formalized in a piece of paper).</p>
              <p><strong>SECTION 5.</strong> Any deliberate and conscious distortion of facts and records from the applicant’s requirements shall be a ground for automatic disqualification.</p>
              <p><strong>SECTION 6.</strong> New AMARANTH staff shall immediately get to work after they have been assigned by the Executive Editor. In case the Executive Editor sees no one fit to appoint to a certain editorial position, he/she shall not appoint just to fill the gap, but instead design the organizational setup and the program of action to offset the shortcoming.</p>
              <p><strong>SECTION 7.</strong> Staff members shall enjoy automatic renewal of membership every school year after passing the year-end evaluation conducted by the AMARANTH Editorial Board and Staff.</p>
              <p><strong>SECTION 8.</strong> The following shall be considered valid reasons for his/her a staff’s membership termination from the publication staff:</p>
              <p><strong>SECTION 9.</strong> A staffer’s term shall expire upon his/her graduation or upon acceptance by the executive editor of his/her letter of resignation. In cases of inappropriate behavior/acts committed by a staffer, due process shall be observed wherein the erring staffer shall be allowed to explain his/her side to a disciplinary tribunal composed of the adviser(s) and the editorial board. On condition that an editorial board member is the subject of the disciplinary sanction, the remaining members of the editorial board shall convene with the adviser(s) to form the disciplinary tribunal. If the staffer in question refuses or fails to attend the tribunal meeting (except for valid excuses), he/she shall automatically forfeit the right to a defense, and termination proceedings shall be conducted by the tribunal. In all cases, majority decisions by the disciplinary tribunal shall be final.</p>
              <p><strong>SECTION 10.</strong> In case a staffer needs to be replaced, the Executive Editor shall select a replacement from other staff and/or adjust the organizational setup accordingly.</p>
              <p><strong>SECTION 11.</strong> Special staff screenings may be requested from the adviser/advisory board whenever necessary.</p>
            </div>
          </div>

          {/* Article V */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE II. GENERAL PROVISIONS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The official university student media organization of the Visayas State University shall be called the “AMARANTH”.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> The AMARANTH will adapt the identity as the university’s official “student media organization” to complement that of the level of service which it renders to the studentry which has evolved from publications of journalistic nature into publishing and producing journalistic and creative media production across print and digital platforms and media.</li>
                </ul>
              <p><strong>SECTION 2.</strong> The AMARANTH shall uphold the students’ and the people’s inalienable rights to constitute press freedom: the right to inform and the right to be informed.</p>
              <p><strong>SECTION 3.</strong> The AMARANTH, by its nature, is completely independent and autonomous from the University Administration, faculty, University Supreme Student Council, and other organizations inside and outside the campus in terms of planning, implementation, and direction of its program of action, financial appropriations and disbursements, and other aspects involving decision- and policy-making within the publication. No forms of censorship, or pressure inimical to press freedom, from any source, shall be used on it.</p>
              <p><strong>SECTION 4.</strong> There shall be formed an editorial board and staff to oversee the continued operation and circulation of the AMARANTH and they shall conduct themselves and their work according to the highest standards and ethics of journalism.</p>
              <p><strong>SECTION 5.</strong> This charter shall govern the actions of any person or entity connected to the student media organization.</p>
              <p><strong>SECTION 6.</strong> Henceforth, this charter shall be called the “AMARANTH CHARTER.”</p>
            </div>
          </div>

          {/* Article VI */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE II. GENERAL PROVISIONS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The official university student media organization of the Visayas State University shall be called the “AMARANTH”.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> The AMARANTH will adapt the identity as the university’s official “student media organization” to complement that of the level of service which it renders to the studentry which has evolved from publications of journalistic nature into publishing and producing journalistic and creative media production across print and digital platforms and media.</li>
                </ul>
              <p><strong>SECTION 2.</strong> The AMARANTH shall uphold the students’ and the people’s inalienable rights to constitute press freedom: the right to inform and the right to be informed.</p>
              <p><strong>SECTION 3.</strong> The AMARANTH, by its nature, is completely independent and autonomous from the University Administration, faculty, University Supreme Student Council, and other organizations inside and outside the campus in terms of planning, implementation, and direction of its program of action, financial appropriations and disbursements, and other aspects involving decision- and policy-making within the publication. No forms of censorship, or pressure inimical to press freedom, from any source, shall be used on it.</p>
              <p><strong>SECTION 4.</strong> There shall be formed an editorial board and staff to oversee the continued operation and circulation of the AMARANTH and they shall conduct themselves and their work according to the highest standards and ethics of journalism.</p>
              <p><strong>SECTION 5.</strong> This charter shall govern the actions of any person or entity connected to the student media organization.</p>
              <p><strong>SECTION 6.</strong> Henceforth, this charter shall be called the “AMARANTH CHARTER.”</p>
            </div>
          </div>

          {/* Article VII */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE II. GENERAL PROVISIONS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The official university student media organization of the Visayas State University shall be called the “AMARANTH”.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> The AMARANTH will adapt the identity as the university’s official “student media organization” to complement that of the level of service which it renders to the studentry which has evolved from publications of journalistic nature into publishing and producing journalistic and creative media production across print and digital platforms and media.</li>
                </ul>
              <p><strong>SECTION 2.</strong> The AMARANTH shall uphold the students’ and the people’s inalienable rights to constitute press freedom: the right to inform and the right to be informed.</p>
              <p><strong>SECTION 3.</strong> The AMARANTH, by its nature, is completely independent and autonomous from the University Administration, faculty, University Supreme Student Council, and other organizations inside and outside the campus in terms of planning, implementation, and direction of its program of action, financial appropriations and disbursements, and other aspects involving decision- and policy-making within the publication. No forms of censorship, or pressure inimical to press freedom, from any source, shall be used on it.</p>
              <p><strong>SECTION 4.</strong> There shall be formed an editorial board and staff to oversee the continued operation and circulation of the AMARANTH and they shall conduct themselves and their work according to the highest standards and ethics of journalism.</p>
              <p><strong>SECTION 5.</strong> This charter shall govern the actions of any person or entity connected to the student media organization.</p>
              <p><strong>SECTION 6.</strong> Henceforth, this charter shall be called the “AMARANTH CHARTER.”</p>
            </div>
          </div>

          {/* Article VIII */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE II. GENERAL PROVISIONS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The official university student media organization of the Visayas State University shall be called the “AMARANTH”.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> The AMARANTH will adapt the identity as the university’s official “student media organization” to complement that of the level of service which it renders to the studentry which has evolved from publications of journalistic nature into publishing and producing journalistic and creative media production across print and digital platforms and media.</li>
                </ul>
              <p><strong>SECTION 2.</strong> The AMARANTH shall uphold the students’ and the people’s inalienable rights to constitute press freedom: the right to inform and the right to be informed.</p>
              <p><strong>SECTION 3.</strong> The AMARANTH, by its nature, is completely independent and autonomous from the University Administration, faculty, University Supreme Student Council, and other organizations inside and outside the campus in terms of planning, implementation, and direction of its program of action, financial appropriations and disbursements, and other aspects involving decision- and policy-making within the publication. No forms of censorship, or pressure inimical to press freedom, from any source, shall be used on it.</p>
              <p><strong>SECTION 4.</strong> There shall be formed an editorial board and staff to oversee the continued operation and circulation of the AMARANTH and they shall conduct themselves and their work according to the highest standards and ethics of journalism.</p>
              <p><strong>SECTION 5.</strong> This charter shall govern the actions of any person or entity connected to the student media organization.</p>
              <p><strong>SECTION 6.</strong> Henceforth, this charter shall be called the “AMARANTH CHARTER.”</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Charter Link */}
          <div className="text-center p-6 border-2 border-dashed border-emerald-200 rounded-lg">
            <h4 className="font-semibold text-emerald-700 mb-2">Complete Charter Document</h4>
            <p className="text-sm text-muted-foreground mb-4">
              The full AMARANTH Charter contains 15 articles detailing all provisions, 
              responsibilities, and operational guidelines.
            </p>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 transition-colors">
              Download Full Charter (PDF)
            </button>
          </div>

      {/* Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-emerald-700">Our Core Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-semibold">Community</h3>
              <p className="text-sm text-muted-foreground">Serving the VSU community with dedication</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-semibold">Accuracy</h3>
              <p className="text-sm text-muted-foreground">Committed to truthful and accurate reporting</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-semibold">Integrity</h3>
              <p className="text-sm text-muted-foreground">Upholding ethical standards in journalism</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-semibold">Excellence</h3>
              <p className="text-sm text-muted-foreground">Striving for quality in all our publications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-700">Get in Touch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Publication Office</h4>
              <p className="text-sm text-muted-foreground">
                Visayas State University<br />
                Baybay City, Leyte, Philippines<br />
                6521-A
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <p className="text-sm text-muted-foreground">
                Email: amaranth@vsu.edu.ph<br />
                Phone: +63 53 335 2601<br />
                Website: amaranth.vsu.edu.ph
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}