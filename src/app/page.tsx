/**
 * Home page — a Server Component.
 *
 * The marketing content (bio, work-experience timeline, senior project, hobbies
 * and the technical-skills list) is static and renders to HTML on the server for
 * fast first paint. The interactive pieces are isolated into small client
 * "islands" under `./home` so only they ship/​hydrate JavaScript:
 *   - <Greeting> / <RotatingWord>  animated hero copy
 *   - <HomeCarousel>               embla image carousel
 *   - <HeroButtons>                auth-gated nav buttons
 *   - <ResumeButton>               sign-in-gated resume download
 *   - <Chatbot>                    floating terminal (lazy-loads Firebase)
 *
 * Scroll-in card animations come from the shared <AnimatedCard> / <AnimatedDiv>
 * wrappers, which are the only client code the static sections depend on.
 */
import React from "react";
import Image from "next/image";
import {
  AnimatedDiv,
  AnimatedStagger,
  AnimatedItem,
} from "@/components/motion/Animated";
import { Greeting, RotatingWord } from "./home/HeroText";
import HeroButtons from "./home/HeroButtons";
import HomeCarousel, { type CarouselSlide } from "./home/HomeCarousel";
import ResumeButton from "./home/ResumeButton";
import Chatbot from "./home/Chatbot";
import Skills from "./home/Skills";
import styles from "./page.module.css";
import Logo from "@/../public/HeaderLogo.png";
import Zach from "@/../public/Zach.jpg";
import Turbo from "@/../public/Turbo.jpg";
import Squad from "@/../public/Squad.jpg";
import Mountains from "@/../public/Mountains.jpg";

const carouselSlides: CarouselSlide[] = [
  {
    src: Mountains,
    alt: "A photo of Zachary Vivian at the Garden of the Gods overlooking Pike's Peak in Colorado Springs, Colorado",
    priority: true,
  },
  {
    src: Zach,
    alt: "A picture of Zachary Vivian on a hike near Fish Creek Falls in Steamboat Springs, Colorado",
  },
  {
    src: Squad,
    alt: "Zachary Vivian and his buddies on a hike near Nederland, Colorado",
  },
  {
    src: Turbo,
    alt: "Image of Zachary Vivian's dog, Turbo",
  },
];

export default function Home() {
  return (
    <>
      <div className={styles.layoutContainer}>
        <div className={styles.heroSection}>
          <AnimatedDiv className={styles.logoContainer}>
            <Image
              src={Logo}
              alt="Zach Vivian's Logo"
              fill
              sizes="(max-width: 900px) 70vw, 420px"
              placeholder="blur"
              priority
              style={{ objectFit: "contain" }}
            />
          </AnimatedDiv>

          <AnimatedDiv className={styles.homeContainer}>
            <Greeting />
            <AnimatedDiv className={styles.infoContainer}>
              <RotatingWord />
              <p className={styles.infoContainerText}>
                I am a cybersecurity professional currently working for On The
                Mark Solutions as a Customer Experience &amp; Product Quality
                Lead. If you'd like to learn more about my experience, projects, and
                technical skills, scroll below. Questions? Press 'Chat' in the
                lower right corner to open a terminal window to ask AI any
                questions you have about my site.
              </p>
              <HeroButtons />
            </AnimatedDiv>

            <HomeCarousel slides={carouselSlides} />
          </AnimatedDiv>
        </div>

        <div className={styles.secondarySection}>
          <div className={styles.cardsGrid}>
            {/* Column 1 — all work experience here so it stacks together on mobile.
                AnimatedStagger makes these cards cascade in top-to-bottom. */}
            <AnimatedStagger className={styles.cardsColumn}>
              <AnimatedItem className={styles.card} index={0}>
                <p>
                  <strong>Education: </strong>I graduated from The University of
                  Wisconsin - Platteville, with a Bachelor of Science in
                  Cybersecurity and a Minor in Business Administration in May
                  2024.
                </p>
              </AnimatedItem>
              <AnimatedItem className={styles.card} index={1}>
                <p>
                  <strong>About Me: </strong>My academic journey has fueled a
                  passion for specializing in either penetration testing or
                  incident response, with the goal of safeguarding your
                  organization against sophisticated cyber threats and
                  vulnerabilities. As a diligent and quick learner, I am keen on
                  employing advanced analytical tools to thoroughly evaluate
                  potential security breaches. My proficiency in applying
                  cybersecurity frameworks and conducting comprehensive risk
                  assessments enables me to develop strategic approaches to
                  bolster your cybersecurity posture. My ambition is to
                  contribute to your team by not only preempting and mitigating
                  cyber attacks through robust security protocols but also
                  ensuring a resilient and adaptive security infrastructure.
                </p>
              </AnimatedItem>
              <h3 className={styles.timelineSectionTitle}>Work Experience</h3>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineDateBadge}>2024–Now</div>
                  <AnimatedItem className={styles.card} index={2}>
                    <p>
                      <strong>
                        On The Mark Solutions — Customer Experience &amp; Product
                        Quality Lead (formerly Implementation &amp; Support
                        Specialist):
                      </strong>{" "}
                      The primary point of contact for OTMS's clients throughout the
                      implementation process + ongoing support. Creating accurate
                      documentation for user guides and troubleshooting resources,
                      configuring POS software to meet client-specific requirements,
                      providing technical training to clients, and
                      resolving/troubleshooting issues. Also responsible for
                      planning implementation timelines, coordinating with
                      cross-functional teams, and ensuring a smooth transition for
                      clients adopting new software solutions. Also ensuring
                      software quality and version testing by validating
                      releases before client deployment as well as gathering and relaying
                      product feedback to the development team.
                    </p>
                  </AnimatedItem>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineDateBadge}>2022–2024</div>
                  <AnimatedItem className={styles.card} index={3}>
                    <p>
                      <strong>Lands&apos; End — Orderfiller:</strong> Worked
                      independently in a fast-paced environment picking clothing
                      orders and sorting pieces. Also worked in the shipping
                      department loading truck trailers with packed merchandise.
                    </p>
                  </AnimatedItem>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineDateBadge}>2019–2023</div>
                  <AnimatedItem className={styles.card} index={4}>
                    <p>
                      <strong>
                        Blain&apos;s Farm &amp; Fleet — Automotive Sales Associate:
                      </strong>{" "}
                      During most of my college, I worked part time at F&amp;F
                      supervising and training the automotive sales department
                      employees on customer service, special orders, and planograms.
                      Worked alongside management to implement the new warehouse
                      management system. Forklift Certified and DOT Hazards trained,
                      assisted in the warehouse unloading freight trucks, loading
                      customer vehicles, and building equipment and floor models.
                      Also worked in the Automotive Service Center as an advisor to
                      set up vehicle appointments and order tires.
                    </p>
                  </AnimatedItem>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineDateBadge}>2017–2019</div>
                  <AnimatedItem className={styles.card} index={5}>
                    <p>
                      <strong>
                        House on the Rock — Food Service Worker:
                      </strong>{" "}
                      Between my Junior and Senior years of high school, I worked at
                      the popular tourist attraction and resort directing guests and
                      answering questions, performed general housekeeping and
                      cleaning displays as well as changing decorational themes for
                      seasonal events. Ended up working in the pizza restaurant as
                      well as the ice cream shop serving guests.
                    </p>
                  </AnimatedItem>
                </div>
              </div>
            </AnimatedStagger>
            {/* Column 2 — skills, projects, hobbies (also cascades top-to-bottom) */}
            <AnimatedStagger className={styles.cardsColumn}>
              <AnimatedItem className={styles.card} index={0}>
                <Skills />
              </AnimatedItem>
              <AnimatedItem className={styles.card} index={1}>
                <p>
                  <strong>Senior Project:</strong> Our senior project integrates
                  our cumulative knowledge of the software development
                  lifecycle, focusing on creating virtual labs for educational
                  use. My team's role involves developing scalable containers
                  and pre-configured virtual machines for Windows and Linux,
                  utilizing Proxmox VE. This allows professors to effortlessly
                  assign and auto-grade lab assignments, providing a practical,
                  hands-on learning experience for students. This initiative
                  highlights our capability to apply theoretical concepts to
                  real-world challenges, enhancing the educational toolkit for
                  future academic use. Due to some difficulties the team had
                  with the UI towards the end of the project, I quickly remade
                  the entire UI with the experience I had gained from making
                  this website.
                </p>
              </AnimatedItem>
              <AnimatedItem className={styles.card} index={2}>
                <p>
                  <strong>Hobbies:</strong> In my leisure hours, I'm passionate
                  about exploring the great outdoors, often found backpacking
                  with my friends and my dog, Turbo, by my side. Beyond these
                  adventures, I have a keen interest in photography and
                  longboarding, which allows me to appreciate the world's beauty
                  from different perspectives. Additionally, I dedicate time to
                  personal projects, like developing this website, which not
                  only fuels my creativity but also sharpens my technical
                  skills. Besides that, I enjoy spending the rest of my time
                  playing video games and spending time with family and friends.
                </p>
              </AnimatedItem>
            </AnimatedStagger>
          </div>

          <ResumeButton />
        </div>
      </div>

      <Chatbot />
    </>
  );
}
