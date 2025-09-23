import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Target, Heart, Award, Italic, Facebook } from 'lucide-react';

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
                    <li><strong>1.</strong> Executive Editor, Managing Editor, Business Manager, and Section Editors;</li>
                    <li><strong>2.</strong> A representative from the Board of Advisors; and</li>
                    <li><strong>3.</strong> A Media practitioner or a university faculty in the communication/journalism field.</li>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li><strong>i.</strong> The screening committee shall be responsible for conduct of the screening processes of the applicants.</li>
                      </ul>
                </ul>
              <p><strong>SECTION 3.</strong> Applicants must take the annual screening to be prepared, conducted and supervised by the Screening Committee. This shall be held not later than the first month of the current semester. Current staff shall have the opportunity to interview the applicants. The following processes are to be undergone by the applicants:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>1.</strong> Technical/Practical test</li>
                  <li><strong>2.</strong> Interview</li>
                  <li><strong>3.</strong> Assessment of results of technical test and interview.</li>
                  <li><strong>4.</strong> The Screening Committee can also assess their work portfolio and previous journalistic or media affiliations.</li>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li><strong>i.</strong> The passers of the final assessment shall be subject to a 6-month (1 full term) of probationary status as “member-trainees” and shall be subject to a final evaluation to be a fully-fledged member come the 2nd term of the said academic year.</li>
                    </ul>
                </ul>
              <p><strong>SECTION 4.</strong> The Executive Editor shall select the other members of the editorial board, which are the managing editor, the business manager, and section editors. He/she shall also assign the circulation manager, beat reporters/writers, and artists/photographers for the year and incorporate the names of the newly passed staff into the AMARANTH organizational setup. The year/s new AMARANTH organizational setup shall be endorsed to the University President for recognition and acknowledgment (formalized in a piece of paper).</p>
              <p><strong>SECTION 5.</strong> Any deliberate and conscious distortion of facts and records from the applicant’s requirements shall be a ground for automatic disqualification.</p>
              <p><strong>SECTION 6.</strong> New AMARANTH staff shall immediately get to work after they have been assigned by the Executive Editor. In case the Executive Editor sees no one fit to appoint to a certain editorial position, he/she shall not appoint just to fill the gap, but instead design the organizational setup and the program of action to offset the shortcoming.</p>
              <p><strong>SECTION 7.</strong> Staff members shall enjoy automatic renewal of membership every school year after passing the year-end evaluation conducted by the AMARANTH Editorial Board and Staff.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>i.</strong> The AMARANTH Editorial Board shall inform the staff of the result of the evaluation.</li>
                  <li><strong>ii.</strong> The staff who passed the evaluation, upon receipt of the notice, shall then write a letter of acceptance of the duties that will be assigned to them otherwise they shall reject the offer.</li>
                  <li><strong>iii.</strong> They are then renewed unless they are subjected to termination procedures.</li>
                  <li><strong>iv.</strong> Positions in the staff organizational structure are subject to change upon consent of the Executive Editor as long as valid reasons are provided.</li>
                </ul>
              <p><strong>SECTION 8.</strong> The following shall be considered valid reasons for his/her a staff’s membership termination from the publication staff:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>8.1</strong> Graduation from the University or voluntary resignation;</li>
                  <li><strong>8.2</strong> Prolonged physical incapacity;</li>
                  <li><strong>8.3</strong> Unethical or indecent acts/behavior;</li>
                  <li><strong>8.4</strong> Willful disregard/violation of the duties/rules provided by this Charter, RA 7079, the AMARANTH editorial policies, and/or majority decisions made by the AMARANTH staff; and</li>
                  <li><strong>8.5</strong> Incompetence.</li>
                </ul>
              <p><strong>SECTION 9.</strong> A staffer’s term shall expire upon his/her graduation or upon acceptance by the executive editor of his/her letter of resignation. In cases of inappropriate behavior/acts committed by a staffer, due process shall be observed wherein the erring staffer shall be allowed to explain his/her side to a disciplinary tribunal composed of the adviser(s) and the editorial board. On condition that an editorial board member is the subject of the disciplinary sanction, the remaining members of the editorial board shall convene with the adviser(s) to form the disciplinary tribunal. If the staffer in question refuses or fails to attend the tribunal meeting (except for valid excuses), he/she shall automatically forfeit the right to a defense, and termination proceedings shall be conducted by the tribunal. In all cases, majority decisions by the disciplinary tribunal shall be final.</p>
              <p><strong>SECTION 10.</strong> In case a staffer needs to be replaced, the Executive Editor shall select a replacement from other staff and/or adjust the organizational setup accordingly.</p>
              <p><strong>SECTION 11.</strong> Special staff screenings may be requested from the adviser/advisory board whenever necessary.</p>
            </div>
          </div>

          {/* Article V */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE V. SELECTION OF THE EXECUTIVE EDITOR</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> Any staff member who is a Filipino citizen and who has at least two (2) years of service to the AMARANTH publication is eligible to apply for the position of Executive Editor. When no one in the staff meets this service requirement, it shall be lowered to one (1) year.</p>
              <p><strong>SECTION 2.</strong> The outgoing Editorial Board is responsible for the recommendation on the Executive Editor position based on their performance, leadership skills, and tenure. They shall decide on it in a quorum vote of 50 plus 1. </p>
              <p><strong>SECTION 3.</strong> If they didn’t reach the quorum, the AMARANTH adviser(s) shall coordinate the formation of the screening committee, which shall be composed of the AMARANTH adviser/advisory board, one College faculty (of similar competence to the adviser(s), and one professional mass media practitioner. The AMARANTH adviser/member of the advisory board shall preside over the screening committee.</p>
              <p><strong>SECTION 4.</strong> The eligible members can submit their applications formalized in a piece of paper addressed to the Screening Committee stating their intent to apply for the Executive Editor Position.</p>
              <p><strong>SECTION 5.</strong> Applicants for Executive editorship must take the competitive examination prepared, conducted and supervised by a screening committee not later than 2 weeks before the end of the second semester. In case an applicant runs unopposed, he/she shall be screened alone.</p>
              <p><strong>SECTION 6.</strong> The competitive examination shall be composed of two phases, written and oral. The screening committee shall prepare the written examination, which shall cover the following:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4"></ul>
                  <li><strong>Editorial writing </strong> - 50%</li>
                  <li><strong>news writing</strong> - 20%</li>
                  <li><strong>Headline writing</strong> - 10%</li>
                  <li><strong>Layout</strong> - 20%</li>
              <p>The oral examination shall be given after the written examination. The written examination shall take up 70% while the oral part shall take up the remaining 30% of the competitive exam.
	The whole competitive examination shall be such that the examinee’s total knowledge and commitment to journalism and its ethics will be severely tested.
</p>
              <p><strong>SECTION 7.</strong> The examinee with the highest rating shall be named by the screening committee as the incoming executive editor who shall assume office in the midyear term or on the first term of the incoming academic year. If he/she declines or is unable to assume post, the next in the rating shall be named and so on. If they are all unable, the screening committee shall call for another competitive examination and this time, the other staff shall be qualified to apply without a regard to length of publication service. In extreme cases (e.g. no one applies for a position), a student OIC and staff of competent publication caretakers shall be formed by the screening committee.</p>
              <p>If the incoming Executive Editor cannot assume office in the summer term (e.g. in case of field practice, or non-enrolment), he shall designate an officer-in-charge (OIC) for the summer term. Should the Executive Editor fail to assume office in the first semester, the mechanism for succession and reexamination as described in paragraph 1 of this section shall apply.</p>
              <p><strong>SECTION 8.</strong> In the first semester, the new publication staff and editorial board organized by the new Executive Editor shall immediately assume their functions even before the new organizational setup is presented to the University President. This is to ensure the publication’s continued operation (and is consistent with Art. (I) Sec. (3-G) of this charter).</p>
            </div>
          </div>

          {/* Article VI */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE VI. DUTIES OF STAFF MEMBERS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> It is the duty of a member of the AMARANTH publication staff to:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>1.1 </strong> Uphold the AMARANTH Charter and abide by its principles, rules and regulations;</li>
                  <li><strong>1.2 </strong> Advocate and actively subscribe to the standards and ethics of journalism; and</li>
                  <li><strong>1.3 </strong> Abide by the editorial policies that shall be formulated by the AMARANTH publication staff members.</li>
                </ul>
              <p><strong>SECTION 2.</strong> No member of the AMARANTH shall run for an elective position in the Supreme Student Council.</p>
            </div>
          </div>

          {/* Article VII */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE VII. THE EDITORIAL BOARD</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The Editorial board shall have the right to give and implement the decisions in policy-making matters.</p>
              <p><strong>SECTION 2.</strong> The Editorial Board shall be composed of the following:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <p><em>Top Level</em></p>
                  <li>Executive Editor</li>
                  <li>Managing Editor</li>
                  <li>Business Manager</li>
                  <li>Editorial Consultant/Editor Emeritus</li>
                </ul>

                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <p><em>Specialized Sections Level</em></p>
                  <p><strong>Executive Department</strong></p>
                  <li>News Editor</li>
                  <li>Opinion Editor</li>
                  <li>Multimedia Production Head</li>
                  <li>Creatives and Design Head</li>
                  <li>Features Editor</li>
                  <li>Literary Editor</li>
                  <li>Sports Editor</li>
                  <li>Visual Editor</li>
                  <li></li>

                  <p><strong>Managing Department</strong></p>
                  <li>Finance manager</li>
                  <li>Business manager</li>
                  <li>Circulations Manager</li>
                  <li>Media Manager</li>
                  <li></li>

                  <p><strong>Multimedia Department</strong></p>
                  <li>Head Photo editor</li>
                  <li>Head Video editor</li>
                  <li></li>

                  <p><strong>Creatives and Design Department</strong></p>
                  <li>Layout Artists</li>
                  <li>Cartoonists</li>
                  <li>Digital Artists</li>
                  <li>Visual Editor</li>
                  <li></li>
                </ul>
                
              <p><strong>SECTION 3.</strong> Each member of the Editorial board shall be entitled to one (1) vote in decision-making in publication matters.</p>
              <p><strong>SECTION 4.</strong> The Editorial Board shall be responsible for the continued enforcement of plans and directives set upon by the provisions of this charter.</p>
              <p><strong>SECTION 5.</strong> The Editorial Board shall consider a decision final when a majority of votes is met.</p>
            </div>
          </div>

          {/* Article VIII */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-700">ARTICLE VIII. GENERAL STAFF FUNCTIONS</h3>
            
            <div className="space-y-3">
              <p><strong>SECTION 1.</strong> The Executive Editor shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>1.1</strong> Supervise the editorial staff of the AMARANTH;</li>
                  <li><strong>1.2</strong> Write the editorials;</li>
                  <li><strong>1.3</strong> Cause the accomplishment of all assignments properly and on time;</li>
                  <li><strong>1.4</strong> Act as liaison between the editorial staff and the adviser;</li>
                  <li><strong>1.5</strong> Coordinate with the University and representatives of the student sectors in matters concerning the publication;</li>
                  <li><strong>1.6</strong> Call all meetings of the staff; and</li>
                  <li><strong>1.7</strong> Act as the official representative of the AMARANTH.</li>
                </ul>
              <p><strong>SECTION 2.</strong> The Managing Editor shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>2.1</strong> Assist the Executive editor in performing his/her functions;</li>
                  <li><strong>2.2</strong> Write editorials when the Executive editor is unable;</li>
                  <li><strong>2.3</strong> Supervise the preparation of the layout and paging of the AMARANTH in cooperation with the executive editor and the layout artist;</li>
                  <li><strong>2.4</strong> Edit articles in cooperation with the executive editor;</li>
                  <li><strong>2.5</strong> Prepare assignments of section editors in cooperation with the executive editor;</li>
                  <li><strong>2.6</strong> Cooperate with the executive editor in the preparation of the paper’s layout and paging of the same;</li>
                  <li><strong>2.7</strong> Oversee the managing of all online accounts and websites belonging or associated with the AMARANTH in cooperation with the executive editor.</li>
                  <li><strong>2.8</strong> Serve as the public relations officer of the AMARANTH;</li>
                  <li><strong>2.9</strong> Represent the AMARANTH on behalf of the executive editor if he/she is not present.</li>
                </ul>
              <p><strong>SECTION 3.</strong> The Business Manager shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>3.1</strong> Check the financial operation of the publication;</li>
                  <li><strong>3.2</strong> Prepare the production schedule of each publication issue;</li>
                  <li><strong>3.3</strong> Prepare the periodic management and financial reports;</li>
                  <li><strong>3.4</strong> Manage the disbursement of publication funds;</li>
                  <li><strong>3.5</strong> Coordinate with the AMARANTH clerk for the processing of administrative processes and other publication transactions; and</li>
                  <li><strong>3.6</strong> Shall conduct a bi-annual (every term) inventory of AMARANTH equipment and procurements.</li>
                  <li><strong>3.7</strong> Serve as the Property Custodian of the AMARANTH equipment and procurements.</li>
                </ul>
              <p><strong>SECTION 4.</strong> The Editorial Consultant and Editor Emeritus is a current member or an ex-officio formerly belonging to top-level position/s in the publication. They shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>4.1</strong> Advise the Editorial Board regarding policies and managing of the publication;</li>
                  <li><strong>4.2</strong> Act as liaison between the publication, the advisory board, and the administration.</li>
                </ul>
              <p><strong>SECTION 5.</strong> The News Editor and the Opinion Editor shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>5.1</strong> Assign the reporters to cover events relevant to their respective areas;</li>
                  <li><strong>5.2</strong> Write articles on assignment from the executive editor and/or the managing editor or through their own initiative in consultation with the executive editor;</li>
                  <li><strong>5.3</strong> Edit all articles received by their respective sections preparatory to submission to the executive editor;</li>
                  <li><strong>5.4</strong> Collect and keep articles.</li>
                  <li><strong>5.5</strong> Assist in the preparation of the paper.</li>
                </ul>
              <p><strong>SECTION 6.</strong> The Media Manager shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>6.1</strong> Safeguard and manage all of the online accounts and websites belonging to or associated with the AMARANTH in cooperation with the managing editor and the executive editor.</li>
                  <li><strong>6.2</strong> Assign the staff member/s to cover events relevant to their respective areas;</li>
                  <li><strong>6.3</strong> Write articles on assignment from the executive editor and/or the managing editor or through their own initiative in consultation with the executive editor;</li>
                  <li><strong>6.4</strong> Edit all articles/outputs received by the section heads preparatory to submission to the managing editor;</li>
                  <li><strong>6.5</strong> Upon the approval of articles/outputs for posting by the managing editor and the executive editor, the online editor shall then proceed with the posting of the articles/outputs;</li>
                  <li><strong>6.6</strong> Oversee the analytics of the posts and report on their status and areas to improve regarding the engagement and reach of the posts.</li>
                  <li><strong>6.7</strong> They shall monitor for message/s, comment/s, share/s that violates the community safety standards of the platforms AMARANTH have accounts to and shall take necessary steps, after having been discussed to the editorial board, in any but not limited to the following:</li>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li><strong>- </strong> reporting</li>
                      <li><strong>- </strong> blocking</li>
                      <li><strong>- </strong> restricting</li>
                      <li><strong>- </strong> if inciting violence and mass destruction, report to appropriate institutions/agencies.</li>
                    </ul>
                </ul>
              <p><strong>SECTION 7.</strong> The Creatives and Design Head and Multimedia Production Head shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>7.1</strong> Assist the Editorial Board in determining the layout of the print and online issues;</li>
                  <li><strong>7.2</strong> Assign the staff/members to create graphics to outputs/articles upon the request of the other section heads and/or the editorial board.</li>
                  <li><strong>7.3</strong> Take initiative on creating graphics and delegating tasks to other staff under the department;</li>
                  <li><strong>7.4</strong> Coordinate with the editorial board in creating a consistency in the layout of general issues either print or online.</li>
                  <li><strong>7.5</strong> Collect and keep outputs.</li>
                </ul>
              <p><strong>SECTION 8.</strong> The other section editors shall be composed of the Feature Editors, Literary Editors, and S & T Editor. They shall have the following functions:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>8.1</strong> Assign the staff member/s to cover events relevant to their respective areas;</li>
                  <li><strong>8.2</strong> Write articles on assignment from the executive editor and/or the managing editor or through their own initiative in consultation with the executive editor;</li>
                  <li><strong>8.3</strong> Edit all articles/outputs received by their respective sections preparatory to submission to the managing editor;</li>
                  <li><strong>8.4</strong> Collect and keep articles.</li>
                </ul>
              <p><strong>SECTION 9.</strong> The Correspondents shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>9.1</strong> Secure the cold facts of an assigned event/idea and write all articles out of the same;</li>
                  <li><strong>9.2</strong> Receive assignments from the section editors and accomplish the same properly and on time;</li>
                  <li><strong>9.3</strong> Feature writers shall assist the artists in conceptualizing the look/illustrations of their articles;</li>
                  <li><strong>9.4</strong> Deliver their assigned articles on a timely manner in accordance to relevance it requires;</li>
                  <li><strong>9.5</strong> Take initiative in writing articles of interest to AMARANTH stakeholders.</li>
                </ul>
              <p><strong>SECTION 10.</strong> The Multimedia Team shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>10.1</strong> Take pictures on assignment by the editors;</li>
                  <li><strong>10.2</strong> Prepare pictorial articles in consultation with the managing editor and executive editor;</li>
                  <li><strong>10.3</strong> Write the captions of the pictures utilized in cooperation with the executive editor, the managing editor, and the online editor;</li>
                  <li><strong>10.4</strong> Label or properly identify all pictures made available for publication;</li>
                  <li><strong>10.5</strong> Keep a file of audio, pictures and videos (campus figures, landmarks, events) for future use;</li>
                  <li><strong>10.6</strong> Produce regular content for print and online purposes.</li>
                </ul>
              <p><strong>SECTION 11.</strong> The Creatives and Design Team shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>11.1</strong> Help in the preparation of pictorial stories;</li>
                  <li><strong>11.2</strong> Prepare editorial cartoons in cooperation with the executive editor;</li>
                  <li><strong>11.3</strong> Make/prepare the design specifications for the AMARANTH in consultation with the managing editor;</li>
                  <li><strong>11.4</strong> Make/prepare illustrations for feature articles, and patterns for typesetting of heads in consultation with the writers and editors.</li>
                </ul>
              <p><strong>SECTION 12.</strong> The Circulation Manager shall:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>12.1</strong> Make up a list of school papers sent by other schools;</li>
                  <li><strong>12.2</strong> Mail copies of the AMARANTH to these schools;</li>
                  <li><strong>12.3</strong> Keep files of useful school information, such as class lists, organization presidents and advisers, administrative officials, etc;</li>
                  <li><strong>12.4</strong> Answer any request for AMARANTH copies;</li>
                  <li><strong>12.5</strong> Devise a system with the Executive editor for the AMARANTH distribution to the students and keep the paper in proper circulation.</li>
                </ul>
              <p><strong>SECTION 13.</strong> The above functions and others, which may be determined by the editorial staff, shall be included in the AMARANTH Editorial Policies.</p>
            </div>
          </div>

          {/* Article IX */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE IX. BOARD OF ADVISERS</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> The AMARANTH Editorial Board shall prepare a list of prospective advisers which shall be composed of regular VSU employees with good moral character, communication skills, journalism know-how and working knowledge on publication production that shall compose its Board of Advisers.</p>
                
                <p><strong>SECTION 2.</strong> The Board of Advisers shall be composed of any but not limited to the following, with their corresponding functions:</p>
                
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>A. The Administrative Adviser, shall:</strong>
                    <ul className="list-circle list-inside space-y-1 ml-6">
                      <li>Provide assistance in polishing the administrative, operational, organizational systems and processes of the publication;</li>
                      <li>Represent the publication in the University's Administration in matters affecting the publication especially in the conduct of press freedom and rights of students.</li>
                    </ul>
                  </li>
                  
                  <li><strong>B. The Legal Adviser, shall:</strong>
                    <ul className="list-circle list-inside space-y-1 ml-6">
                      <li>Provide assistance and guide in instances that necessitate legal counsel;</li>
                      <li>Represent the publication, along with a legal counsel or a lawyer, in court and other judicial proceedings.</li>
                    </ul>
                  </li>
                  
                  <li><strong>C. Content/Technical Adviser, shall:</strong>
                    <ul className="list-circle list-inside space-y-1 ml-6">
                      <li>Provide assistance and guide in technical and content aspects of the releases and publications;</li>
                      <li>Assist in improving the content quality and facilitating in presenting and suggesting sociopolitical ideas that sparks discussion among the masses as part of experience and professional growth of the student journalists.</li>
                    </ul>
                  </li>
                  
                  <li><strong>D. Administrative Clerk, shall:</strong>
                    <ul className="list-circle list-inside space-y-1 ml-6">
                      <li>Provide assistance to the Editorial Board in the administrative, operational, organizational systems and processes of the publication.</li>
                    </ul>
                  </li>
                  
                  <li><strong>E. Utility Staff, shall:</strong>
                    <ul className="list-circle list-inside space-y-1 ml-6">
                      <li>Provide assistance in the maintenance of the newsroom and the Amaranth-procured equipment.</li>
                    </ul>
                  </li>
                </ul>
                
                <p><strong>SECTION 3.</strong> The Administrative Clerk and the Utility Staff shall enjoy an honorarium from the Amaranth fund.</p>
                <p><strong>SECTION 4.</strong> The AMARANTH editorial board shall submit the name of their chosen adviser(s) to the University President for recognition. The adviser(s) shall serve a term of one year from the date he/they accept the position from the editorial board.</p>
                <p><strong>SECTION 5.</strong> The incumbent adviser(s) shall enjoy automatic renewal of his/their term when no new adviser/list of advisers is submitted by the editorial board and staff to the University President.</p>
                <p><strong>SECTION 6.</strong> The AMARANTH Adviser/Advisory Board shall have functions of technical nature and guidance. These functions shall include being property custodians of equipment; and guarantors of purchases, services rendered and the like. The adviser(s) shall also serve as liaison officer(s) between the publication staff and the University.</p>
                <p><strong>SECTION 7.</strong> The AMARANTH adviser(s) shall not be held responsible to the University and to third parties for decisions, actions and policies made by the AMARANTH editorial board and staff, and legal consequences arising from such.</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>7.1</strong> Their appointment shall be bound in paper to undergo administrative processing.</li>
                </ul>
                
                <p><strong>SECTION 8.</strong> The AMARANTH editorial board and staff can terminate the services of the adviser(s). The following shall be considered valid reasons for the termination of the publication adviser:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>8.1</strong> Voluntary resignation;</li>
                  <li><strong>8.2</strong> Prolonged physical incapacity;</li>
                  <li><strong>8.3</strong> Unethical or indecent acts/behavior;</li>
                  <li><strong>8.4</strong> Willful disregard/violation of the duties/rules provided by this Charter, RA 7079, the AMARANTH editorial policies, and/or majority decisions made by the AMARANTH staff; and</li>
                  <li><strong>8.5</strong> Incompetence.</li>
                </ul>
              </div>
            </div>

            {/* Article X */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE X. ORGANIZATIONAL SETUP AND MEETINGS</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> The editorial board, composed by the executive editor, managing editor, and business manager and the different section editors shall formulate the editorial policies of the AMARANTH. Below them are the other publication staff. The adviser(s) come next as consultant(s).</p>
                <p><strong>SECTION 2.</strong> The executive editor shall preside over all meetings. The associate or managing editor shall preside in the absence of the executive editor.</p>
                <p><strong>SECTION 3.</strong> In regular meetings (the date, time and frequency of which shall be determined by the staff and included in the editorial policies), a quorum consists of fifty percent of members plus one.</p>
                <p><strong>SECTION 4.</strong> Emergency/special meetings may be called by the executive editor whenever necessary in which case a quorum can consist of a majority of the editorial board members.</p>
                <p><strong>SECTION 5.</strong> Each member of the publication staff shall be entitled to one (1) vote in a decision/policy to be made should the Editorial Board deem it necessary for consensus. A majority decision consists of fifty percent vote of all members present plus one.</p>
                <p><strong>SECTION 6.</strong> The executive editor shall appoint a staff to take down the minutes of the meeting.</p>
              </div>
            </div>

            {/* Article XI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE XI. GUIDELINES ON THE FORMULATION OF EDITORIAL POLICIES</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> The AMARANTH Editorial board may formulate yearly editorial policies or may opt to adopt the editorial policies of the previous staff. The editorial policies are the set of guidelines by which the AMARANTH shall be operated and managed. The Editorial Policies shall include any or all of the following as an adjunct to this Charter:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>1.1</strong> House Rules;</li>
                  <li><strong>1.2</strong> Board Resolutions;</li>
                  <li><strong>1.3</strong> Executive Orders;</li>
                  <li><strong>1.4</strong> Directories;</li>
                  <li><strong>1.5</strong> Advisories;</li>
                </ul>
                
                <p><strong>SECTION 2.</strong> The Editorial Policies and the adjunct documents shall be presented to the staff and agreed upon by the Editorial Board and noted by the Advisory Board.</p>
                <p><strong>SECTION 3.</strong> The editorial policies shall be in accordance with the AMARANTH Charter and shall take into account pertinent laws and the University Code.</p>
                <p><strong>SECTION 4.</strong> The editorial policies shall determine the format(s) of the paper, the frequency of publication, manner of selecting articles and features, and other similar matters taking into account cost, efficiency and value consideration.</p>
                <p><strong>SECTION 5.</strong> The editorial policies shall delineate clear cut duties, responsibilities and privileges of the AMARANTH staff members.</p>
                <p><strong>SECTION 6.</strong> The editorial policies shall be based on the ethics and standards of journalism, and shall be to the best interest of the students.</p>
              </div>
            </div>

            {/* Article XII */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE XII. PROTECTION OF STAFF MEMBERS</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> The protection of the Amaranth staff shall be in accordance with Sections 15-19 of the Campus Journalism Act of 1991 (RA 7079).</p>
                <p><strong>SECTION 2.</strong> A staff member shall not be suspended or expelled from the University solely on the basis of the article/item he/she has written, or on the performance of his/her duties in the publication. Termination of a staff member shall adhere to the provisions stipulated in Art. (IV), Sec. (8) of this Charter.</p>
              </div>
            </div>

            {/* Article XIII */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE XIII. AMENDMENTS</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> This Charter shall be subject to amendments and ratification. The ratification of an amendment shall be done by the students of the university through a two-thirds vote of those present in a plebiscite.</p>
                <p><strong>SECTION 2.</strong> Any bona fide college student can propose amendments to this Charter and such must be made in formal writing to the AMARANTH Publication Staff.</p>
              </div>
            </div>

            {/* Article XIV */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE XIV. SEPARABILITY CLAUSE</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> If any provision or part hereof, is held invalid or unconstitutional, the remainder of the Charter or the provision not otherwise affected shall remain valid and subsisting.</p>
              </div>
            </div>

            {/* Article XV */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-700">ARTICLE XV. EFFECTIVITY</h3>
              
              <div className="space-y-3">
                <p><strong>SECTION 1.</strong> This Charter shall take effect upon ratification by a majority of the votes cast by the students present in a plebiscite held for this purpose, and shall supersede all previous rules and regulations governing the AMARANTH.</p>
                <p><strong>SECTION 2.</strong> Copies of this Charter shall be sent to the USSCF and the Office of the Dean of Students, and shall be posted in the College bulletin boards, and an intensive information dissemination shall be conducted by the members of the AMARANTH staff/USSCF before its ratification.</p>
                <p><strong>SECTION 3.</strong> This Charter shall take effect in the first semester, S.Y. 2025-2026 and during the second semester thereafter.</p>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Signatories */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-700">Signatories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-6 border-t">
            <h4 className="font-semibold text-emerald-700">Charter Signatories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Anna Marie R. Naagas</p>
                <p className="text-muted-foreground">Executive Editor</p>
              </div>
              <div>
                <p className="font-medium">Jelly Rose M. Mondejar</p>
                <p className="text-muted-foreground">Managing Editor</p>
              </div>
              <div>
                <p className="font-medium">Chubi C. Soliva</p>
                <p className="text-muted-foreground">Business Manager</p>
              </div>
              <div>
                <p className="font-medium">Xavier John D. Villaruel</p>
                <p className="text-muted-foreground">Editorial Consultant</p>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="font-medium text-emerald-700">Noted by:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <p className="font-medium">Dr. Derek Alviola</p>
                  <p className="text-muted-foreground">Adviser</p>
                </div>
                <div>
                  <p className="font-medium">Engr. Jucel Marie Guatlo</p>
                  <p className="text-muted-foreground">Adviser</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Charter Link */}
      <div className="text-center p-6 border-2 border-dashed border-emerald-200 rounded-lg">
        <h4 className="font-semibold text-emerald-700 mb-2">Get a copy of our Charter</h4>
        <p className="text-sm text-muted-foreground mb-4">
          The AMARANTH Charter contains 15 articles detailing all provisions, 
          responsibilities, and operational guidelines.
        </p>
        <a 
          href="/documents/amaranth-charter.pdf" 
          download="AMARANTH-Charter.pdf"
          className="inline-block bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 transition-colors"
        >
          Download Full Charter (PDF)
        </a>
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
                <a href="https://maps.app.goo.gl/RkTiVWu3LPgkGawA8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 underline hover:underline-offset-2 transition-colors">
                ADE Building, Amaranth Newsroom<br />
                Visayas State University<br />
                Baybay City, Leyte, Philippines<br />
                6521
                </a>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <p className="text-sm text-muted-foreground">
                Email: 
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=amaranth@vsu.edu.ph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 underline hover:underline-offset-2 transition-colors">
                  amaranth@vsu.edu.ph
                </a>
                <br />
                Facebook:
                <a href="https://www.facebook.com/amaranthvsu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 underline hover:underline-offset-2 transition-colors">
                  @amaranthvsu
                </a>
                <br />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}