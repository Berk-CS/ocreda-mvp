const fs = require('fs');
const path = require('path');

const notes = [
  {
    id: "001",
    title: "Subjective Reality",
    originalTitle: "Subjective Reality Personal Choice",
    domain: "discipline action",
    flags: "-",
    text: "There is no actual reality, but that of each person, we all have our own, and whatever we choose to accept becomes real.\n\nSo you can mold your reality to whatever you want."
  },
  {
    id: "002",
    title: "Sequential Focus",
    originalTitle: "Sequential Development Focus",
    domain: "startup ops",
    flags: "-",
    text: "We must build, ship, validate, etc one by one. the company should design and then build. Finish with one thing and then go to the other. If we do too many things at a time with the small tam that we have than we could get in a mess if things have problems, because we would have to go back to fix it and that would delay new projects."
  },
  {
    id: "003",
    title: "Obsesión",
    originalTitle: "Obsesion de los Grandes",
    domain: "spanish",
    flags: "ES",
    text: "Todos los grandes del mundo, estaban obsesionados por su causa, estaban dispuestos hacer cualquier cosa por ella."
  },
  {
    id: "004",
    title: "Accepting Fear",
    originalTitle: "Fear as Probability Acceptance",
    domain: "fear ego",
    flags: "-",
    text: "One way of thinking about fear is that if you accept that there are probabilities of positive outcomes, then fear diminishes and acting with it seems like a normal thing to do.\n\nSo yes look at fear straight in the eye and go."
  },
  {
    id: "005",
    title: "Make It Theirs",
    originalTitle: "Make Them Think It's Theirs",
    domain: "persuasion people",
    flags: "-",
    text: "People don't like to be told what to do or be sold something.\n\nThey like to be consulted, they like the importance of giving unique advice.\n\nSo plant they idea in their heads, make them think that they came up with that idea, thank them, and give them the credit of that idea. They will feel like they owe you something.\n\nYou can start this process by making sudden suggestions or asking them as if they could give you some advice on the topic you want them to develop."
  },
  {
    id: "006",
    title: "Desire Over Fear",
    originalTitle: "Desire Over Fear",
    domain: "fear ego",
    flags: "-",
    text: "Desire must beat fear"
  },
  {
    id: "007",
    title: "Customer Analysis",
    originalTitle: "Customer Behavior Analysis Insights",
    domain: "startup ops",
    flags: "-",
    text: "Thanks to analyzing the behavior of the customers through how they reacted to the experiments we can't blame in on anything else and we can start asking the right questions"
  },
  {
    id: "008",
    title: "Memory Palace",
    originalTitle: "Memory Palace Paradox",
    domain: "memory cognition",
    flags: "-",
    text: "A mental castle can be a fortress or a prison when surrounded."
  },
  {
    id: "009",
    title: "Defying Rejection",
    originalTitle: "Defiance Through Rejection",
    domain: "fear ego",
    flags: "-",
    text: "When someone tells me that that is not a good idea, etc. A few things go on my mind:\n1- That we must at least give it a try.\n2- That I know I can do it.\n3- That I want to prove them wrong.\n\nAlso I don't like rejection, but I feel that there is a way through when you are rejected, probable feedback."
  },
  {
    id: "010",
    title: "Position Innovation",
    originalTitle: "Innovation in service of position",
    domain: "brand positioning",
    flags: "NEW",
    text: "The sharper version: what looks like \"innovation\" in a zag is usually innovation in service of the position, not inventi\n\nSo: the white space tells you what to be different about. The innovation is whatever you must build to make that difference real and hard to copy. The tribe is what makes it worth doing at all."
  },
  {
    id: "011",
    title: "Baseline or Pivot",
    originalTitle: "Baseline Progress or Pivot",
    domain: "startup ops",
    flags: "-",
    text: "If we are not improving the baseline to our ideal then we are not making progress and if it is getting farther then it is time to pivot."
  },
  {
    id: "012",
    title: "The Zag Test",
    originalTitle: "A real zag passes three tests",
    domain: "brand positioning",
    flags: "NEW",
    text: "A real zag passes three tests: it's new (nobody owns it), it's true (you can actually deliver it), and it's needed (the\n\nYou usually iterate: spot a possible space, ask who the tribe is, ask what you'd have to become to own it, then check whether that's a business you can actually run."
  },
  {
    id: "013",
    title: "Control What You Can",
    originalTitle: "Control What You Can 1",
    domain: "stoic obstacle",
    flags: "-",
    text: "Life is always happening, there are things we can't change, but we can also happen to life, we can change, act upon things we can control, and of those things we must give 100% of our efforts, because even if it is 1 in a million chance, there is a chance."
  },
  {
    id: "014",
    title: "Demand More",
    originalTitle: "Demand More, Get More",
    domain: "persuasion people",
    flags: "-",
    text: "Stay hungry, stay foolish. Demand, demand, demand value.\n\nAsk for the moon and you might get it."
  },
  {
    id: "015",
    title: "Unsustainable Growth",
    originalTitle: "Growth Without Sustainable Model",
    domain: "startup ops",
    flags: "-",
    text: "Raising money when you have an unsustainable business can escalate the problem, it would just invest in growth of an failing model or value creation"
  },
  {
    id: "016",
    title: "Life's Work",
    originalTitle: "Finding Your Life's Work",
    domain: "meaning mortality",
    flags: "-",
    text: "To know what to work on, find things that are very important and should exist in the world (this is where you start). Also you must enjoy working on this and you must also have a good combination of things you are good at to apply to this."
  },
  {
    id: "017",
    title: "Charge Day One",
    originalTitle: "Charge From Day One",
    domain: "startup ops",
    flags: "-",
    text: `**Charge vs. Free — When & Why**

**YC's Position: Charge From Day One**
YC advises founders to charge early because it validates real demand — payment proves the pain is worth solving. Paying users also give more serious, actionable feedback. Free users create false positives; they overstate interest but don't convert later. Charging early sets pricing expectations (it's easier to lower price than raise it) and builds revenue discipline by forcing clarity on your value proposition. As Paul Graham puts it: revenue is the strongest signal of product-market fit.

**The "Give It Away Free" Argument**
Others argue for free early distribution, especially for consumer apps, marketplaces, or scale-dependent products. Going free lowers friction for adoption, accelerates user acquisition, and generates more data. It's particularly useful for network-effect products where value grows with users, and it's better when you're validating usability rather than willingness to pay.

**The Real Decision Framework**
The real distinction isn't "free vs paid" — it's about what you're validating. If you're validating problem strength, charge. If you're validating engagement or behavior loops, go free. Network-effect products benefit from free or freemium to reach scale. B2B products with high margins should charge from day one. B2C products with low margins and viral potential are better suited for free or freemium models.

The rule of thumb: if you need scale to create value, go free first. If you need signal that the problem is real, charge first.`
  },
  {
    id: "018",
    title: "Meaning in Hardship",
    originalTitle: "Meaning Sustains Through Hardship",
    domain: "meaning mortality",
    flags: "-",
    text: "There is nothing in the world, I venture to say, that would so effectively help one to survive even the worst conditions as the knowledge that there is a meaning in one's life."
  },
  {
    id: "019",
    title: "Empathy First",
    originalTitle: "Empathy First Communication",
    domain: "persuasion people",
    flags: "-",
    text: "Before speaking or talking to somebody, wether you are selling something or answering. Stop, really think about how that person feels, what they want to hear, what they need, their cause for that action, etc. Then create the best response based on that point of view."
  },
  {
    id: "020",
    title: "Fear of Insignificance",
    originalTitle: "Fear of Meaningless Death",
    domain: "fear ego",
    flags: "-",
    text: "I don't want to die for nothing, I fear insignificance."
  },
  {
    id: "021",
    title: "Simple Words",
    originalTitle: "Simple Words, Deep Meaning",
    domain: "meaning mortality",
    flags: "-",
    text: "Don't overcomplicate with phrases\nYou can use ordinary words and still articulate\nRetain thoughts for longer times\nFocus on attaining words from high quality sources and use them frequently\nSpeak with meaning and thought in mind\nRepeat the question aloud\nAdmit your limitations"
  },
  {
    id: "022",
    title: "Creating Monopolies",
    originalTitle: "There is 5 ways to create a monopoly. 1- 10x better technolo...",
    domain: "brand positioning",
    flags: "-",
    text: "There is 5 ways to create a monopoly.\n1- 10x better technology than the rest of the market\n2- network effects\n3- High profit margins\n4- Branding\n5- Management"
  },
  {
    id: "023",
    title: "Purpose Over Passion",
    originalTitle: "Purpose Over Passion",
    domain: "meaning mortality",
    flags: "-",
    text: "Aim for purpose and realism.\n\nYou want to be clear on what you want in life, and have step by step process on how to accomplish it.\n\nSometimes passion can be formed from ego and rushes into doing things without thinking.\n\nI am not saying that you shouldn't enjoy or love what you do, but sometimes it is grater than that, a purpose, and that only will let you endure hardships that come with what you want to do. Because if you only rely on passion then you will get surprised and ask why it didn't work, regardless of how hard you were working.\n\nAlso passion can be flamboyance in disguise, all day talking and romanticizing what we are doing, but then we have little results and it is frustrating.\n\nPurpose is like passion with boundaries, with direction.\n\nRealism is detachment and perspective.\n\nAim to be in the game, to listen with clarity and ask the right questions. To clearly understand what you are doing and what is next, conscious of what this work entails."
  },
  {
    id: "024",
    title: "Humble Ambition",
    originalTitle: "Ambition Tempered with Humility",
    domain: "discipline action",
    flags: "-",
    text: "What's the truth of your ambition? Do you have the humility to continually grow, to learn from your failures and get back up? Are you utterly relentless for your cause, ferocious for your cause? Can you channel your intensity and intelligence and energy and talents and gifts and ideas outward into something that is bigger and more impactful than you are? That's what great leadership is about.\""
  },
  {
    id: "025",
    title: "Team Strengths",
    originalTitle: "Strengths-Based Team Strategy",
    domain: "startup ops",
    flags: "-",
    text: "Learn what every person is good at and then use them for that.\nPeople mastery (strategy)"
  },
  {
    id: "026",
    title: "Human Mortality",
    originalTitle: "Mortality Erases Human Hierarchy",
    domain: "meaning mortality",
    flags: "-",
    text: "We are all humans and we are going to die, knowing that there is nothing stopping me from doing anything, except my perspective on humans. We are all born and we all leave the same earth."
  },
  {
    id: "027",
    title: "Brand Purpose",
    originalTitle: "Brand Purpose as Touchpoint Filter",
    domain: "brand positioning",
    flags: "-",
    text: "Every touchpoint should be filtered through the brand's 'why' or purpose to ensure alignment with the core message being communicated. This filtering approach creates consistency across all customer interactions and transforms abstract brand purpose into a practical decision-making framework. By asking 'Does this communicate our brand's purpose?' at each touchpoint, companies ensure their stated values match the actual customer experience."
  },
  {
    id: "028",
    title: "Second Thought",
    originalTitle: "First Thought vs Second",
    domain: "discipline action",
    flags: "-",
    text: "The first thought is inevitable, is the second one the one you control."
  },
  {
    id: "029",
    title: "Growth in Failure",
    originalTitle: "Growth Through Failure",
    domain: "startup ops",
    flags: "-",
    text: "Failure and mistakes are training."
  },
  {
    id: "030",
    title: "Analogy Transfer",
    originalTitle: "Cross-Domain Analogy Transfer",
    domain: "memory cognition",
    flags: "-",
    text: "You can use analogies through different areas. Things that work in some way can be use as an example of other things. Past observations can be used to solve new problems. Knowledge can be used across different fields."
  },
  {
    id: "031",
    title: "Creative Potential",
    originalTitle: "Limitless Creative Potential",
    domain: "learning curiosity",
    flags: "-",
    text: "Imagination is the limit"
  },
  {
    id: "032",
    title: "Enriched Living",
    originalTitle: "Learning Through Living",
    domain: "learning curiosity",
    flags: "-",
    text: "I always seek experiences that enrich me.\n\nAt 19 Steve Jobs enrolled in a calligraphy class that taught him valuable lessons that he later applied to apple.\n\nAt 17 I created a company and learned branding, marketing, sales, design, business overall. I did have an amazing experience.\n\nIt will be valuable I know it, so don't let anybody tell you that you are late or to stop wasting your time."
  },
  {
    id: "033",
    title: "Faith in Purpose",
    originalTitle: "Unwavering Faith in Purpose",
    domain: "meaning mortality",
    flags: "-",
    text: "Never stop believing in your cause."
  },
  {
    id: "034",
    title: "Sunk Cost Trap",
    originalTitle: "The Sunk Cost Trap",
    domain: "stoic obstacle",
    flags: "-",
    text: "Companies that cannot bring themselves to pivot and instead keep pouring in resources of any kind making it even harder to pivot, will find themselves suck in the land of the living dead, neither growing nor dying."
  },
  {
    id: "035",
    title: "Present Moment",
    originalTitle: "Present Moment Awareness",
    domain: "personal life",
    flags: "-",
    text: "Focus on the present moment, the now, that is the only thing you can change or be certain about."
  },
  {
    id: "036",
    title: "Alternativas",
    originalTitle: "Alternativas de Alarma",
    domain: "spanish",
    flags: "ES",
    text: "No te alarmes, cuales son las alternativas?"
  },
  {
    id: "037",
    title: "Apply Learning",
    originalTitle: "Apply Your Learning Now",
    domain: "learning curiosity",
    flags: "-",
    text: "It is not a time to think things, to feel sorry for yourself. I want to be great, to do the most.\n\nApply all you have learned once in for all now.\n\nDo it now."
  },
  {
    id: "038",
    title: "Just You",
    originalTitle: "It is just you",
    domain: "personal life",
    flags: "NEW",
    text: "Believe in yourself, your mom does. Are you not confident of what you are doing. People has done it, so it is possible. Today is even easier to create something.\n\nYou want to be significant, this path is will of doubt and loneliness, but you want it, so at least show the fucking normal people what you are made of. They want to be normal hhahahaahaah. Go fucking harder at everything, be more excellent than yesterday."
  },
  {
    id: "039",
    title: "Overcoming Resistance",
    originalTitle: "Overcame Resistance Today",
    domain: "stoic obstacle",
    flags: "-",
    text: "What matters is that today I have overcome resistance.\nI did the work and hit with all I had."
  },
  {
    id: "040",
    title: "Daily Evangelism",
    originalTitle: "Evangelize Your Cause Daily",
    domain: "discipline action",
    flags: "-",
    text: "You should talk about your cause daily and to everyone, make others believe in it too."
  },
  {
    id: "041",
    title: "Growth Beyond Today",
    originalTitle: "Growth Beyond This Moment",
    domain: "startup ops",
    flags: "-",
    text: "You must understand (even more now that you are young) that what you do today, it is not the best work, moment, position that you are going to be. This, today it is just a moment. You will go on to do better, different things, and in constant change."
  },
  {
    id: "042",
    title: "Seize the Day",
    originalTitle: "Seize the Day",
    domain: "personal life",
    flags: "-",
    text: "Carpe diem."
  },
  {
    id: "043",
    title: "Find Your Path",
    originalTitle: "You can fall very easily in a path in life and spend almost ...",
    domain: "discipline action",
    flags: "-",
    text: "You can fall very easily in a path in life and spend almost your whole life there. So if there is something you want to do, go do it now.\n\nIt is also very important to focus on finding what you really want to do before starting."
  },
  {
    id: "044",
    title: "Problems Worth Solving",
    originalTitle: "Problems Worth Solving",
    domain: "stoic obstacle",
    flags: "-",
    text: "To figure out what to do, you can think of problems to solve that will generate great deals of value to humanity if solved or improved a little bit.\n\nThey must be solved, no matter what. So everything that stand in the way, being skill, people, location, money, etc. Those are in control, yes it might take time and energy, but how big is your ambition to make this world better.\n\nAlso remember that even if it is hard, everything can be learned, known, and done."
  },
  {
    id: "045",
    title: "Reason for Happiness",
    originalTitle: "Finding Happiness Through Reason",
    domain: "discipline action",
    flags: "-",
    text: "One must have a reason to \"be happy.\" Once the reason is found, however, one becomes happy automati-cally."
  },
  {
    id: "046",
    title: "Seeing Patterns",
    originalTitle: "Seeing patterns of success",
    domain: "brand positioning",
    flags: "NEW",
    text: "When something new comes along, it will not be received with the most expected excitement, because people will probably not understand it. You do not have to settle on just what you hear, build hypothesis of what it could mean and go test it. Marketing can make it simplier and easier to explain in ways the incumbent market understands. E.g: Two people hear the same sentence, \"I don't get it\": * The novice concludes the idea is bad and softens it. * The innovator recognizes that early discomfort often accompanies a genuinely new category, and asks whether it's confusion-from-novelty (good sign, needs better framing) or confusion-from-incoherence (bad sign, kill it)."
  },
  {
    id: "047",
    title: "Moon Landing",
    originalTitle: "Moon Landing Inspires Achievement",
    domain: "learning curiosity",
    flags: "-",
    text: "Neil Armstrong went to the moon in 1968, to the moon.\nThat means that you can do anything. To the moon."
  },
  {
    id: "048",
    title: "Bowling Pin Strategy",
    originalTitle: "Bowling Pin Market Expansion",
    domain: "brand positioning",
    flags: "-",
    text: "Then repeat outward into adjacent segments (Moore calls this the \"bowling pin\" strategy) — each new segment's early buyers become the next segment's reference."
  },
  {
    id: "049",
    title: "Blessed Struggle",
    originalTitle: "Blessing in Struggle",
    domain: "stoic obstacle",
    flags: "-",
    text: "\"Oh, how blessed young men are who have to struggle for a foundation and beginning in life\""
  },
  {
    id: "050",
    title: "Apa's Drawing",
    originalTitle: "Apa's Drawing for Me",
    domain: "personal life",
    flags: "-",
    text: "Apa made me a drawing"
  },
  {
    id: "051",
    title: "Individual Destinies",
    originalTitle: "Unique Individual Destinies",
    domain: "meaning mortality",
    flags: "-",
    text: "No man and no destiny can be compared to any other man or any other destiny."
  },
  {
    id: "052",
    title: "Intuition in Creation",
    originalTitle: "Intuition Essential to Creation",
    domain: "learning curiosity",
    flags: "-",
    text: "You can't take intuition or human touch out of creation.\nAnd you shouldn't want to."
  },
  {
    id: "053",
    title: "Blocked Paths",
    originalTitle: "Blocked Paths Reveal New Opportunities",
    domain: "stoic obstacle",
    flags: "-",
    text: "Somethings will not work at all, no matter how hard you worked. But in that blocked path a new path is revealed. An opportunity to learn. Accept it instantly and move to whatever is next."
  },
  {
    id: "054",
    title: "Design & Behavior",
    originalTitle: "Design Changes Customer Behavior",
    domain: "startup ops",
    flags: "-",
    text: "Important rule, a good design is one that changes the customer behavior for the better.\n\nExample: the self driving of the Tesla is so well built for the regular driver that people not only buy it for that, but use it so much while driving instead of driving themselves."
  },
  {
    id: "055",
    title: "Intuitive Signals",
    originalTitle: "Intuitive Connection Over Logic",
    domain: "memory cognition",
    flags: "-",
    text: "Most signals, most ideas are not something we can always touch, but something we feel, we connect with intuitively."
  },
  {
    id: "056",
    title: "Action Over Overthinking",
    originalTitle: "Flip Overthinking Into Action",
    domain: "discipline action",
    flags: "-",
    text: "If you feel that you are overthink about something and delaying action, ask yourself.\n\nHow can I ensure that I become worse at what I am trying to accomplish?\n\nThen flip it and you will see what you must do to become better.\n\nE.g. \"I want to become a better writer”\nDo not write\nWrite inconsistently\nWrite about things you find boring\n\nFlip them around:\nWrite\nWrite consistently\nWrite about things that excite you"
  },
  {
    id: "057",
    title: "Interrupted Work",
    originalTitle: "Interrupted Projects Demand Attention",
    domain: "discipline action",
    flags: "-",
    text: "sometimes you stopped doing something you spent time and energy doing, because something else popped up that might be very important and must get done."
  },
  {
    id: "058",
    title: "Deliberate Practice",
    originalTitle: "Expertise Through Determined Practice",
    domain: "learning curiosity",
    flags: "-",
    text: "Anyone can become an expert at anything in six months, whether it is hydrodynamics for boats or cyclonic systems for vacuum cleaners. You are just as likely to solve a problem by being unconventional and determined as by being brilliant.\n\nYou study for what the project demands for."
  },
  {
    id: "059",
    title: "Presence in Silence",
    originalTitle: "Presence Through Silence",
    domain: "persuasion people",
    flags: "-",
    text: "Long silences between words.\nStare in the eyes with a soft gaze."
  },
  {
    id: "060",
    title: "Changing Your Mind",
    originalTitle: "Changing Mind Shows Intelligence",
    domain: "fear ego",
    flags: "-",
    text: "Intelligence lays in the ability to change one's mind and how fast you do it."
  },
  {
    id: "061",
    title: "Finding Purpose",
    originalTitle: "Uselessness and Meaninglessness",
    domain: "meaning mortality",
    flags: "-",
    text: "Being useless can lead to the feeling of a meaningless life."
  },
  {
    id: "062",
    title: "What You Control",
    originalTitle: "What You Can Control",
    domain: "stoic obstacle",
    flags: "-",
    text: "Distinguish the things that you can or can't change.\nDestination stays the same."
  },
  {
    id: "063",
    title: "High Agency",
    originalTitle: "High Agency Drives Solutions",
    domain: "discipline action",
    flags: "-",
    text: "High agency could be the most important quality to have.\n\nIt lets you get stuff done, by disagreeing with conventional wisdom, thinking clearly, and having biased to action.\n\nSee past problems, everything can be solvable, go to first principles, ask if it defies the laws of physics."
  },
  {
    id: "064",
    title: "Know What You Want",
    originalTitle: "Know What You Want",
    domain: "discipline action",
    flags: "-",
    text: "You must know what you want in life. What is important, only then you will have higher chances of achieving it and having pleasure in doing so.\n\nIf you find yourself saying yes too many things then you are unfocused.\n\nFocus comes from saying No to things that one finds compelling because he is doing something else, his purpose.\n\nAsk yourself why you do what you do until you answer, ask yourself that question every single day.\n\nFocus on doing one thing and never stop until you find it.\n\nDon't do things just because people go successful from those, we all have different races to race, find yours and be the best at it, win your race. Have a clear sense of the space you are in.\n\nEgo leads to envy. It makes you feel insignificant compared to others.\n\nAsk why constantly, find what matters and what doesn't and opt out of races that waste the precious time you have left."
  },
  {
    id: "065",
    title: "Charisma",
    originalTitle: "Charisma will bring you followers",
    domain: "persuasion people",
    flags: "NEW",
    text: "Charisma will bring you followers, so be confident, extremely confident in what you say, have a strong point of view on something that people can relate to"
  },
  {
    id: "066",
    title: "Founder's Handbook",
    originalTitle: "Startup Founder's Handbook",
    domain: "startup ops",
    flags: "-",
    text: "Guide for Start-ups"
  },
  {
    id: "067",
    title: "Autotelic Work",
    originalTitle: "untitled 19",
    domain: "ocreda",
    flags: "AI",
    text: "autotelic: done for its own sake and for the sheer enjoyment of doing it"
  },
  {
    id: "068",
    title: "Work Before Healing",
    originalTitle: "Work Before Healing",
    domain: "discipline action",
    flags: "-",
    text: "Waiting to heal before working is a type of resistance, the part that does the work can't be touched by anything. What might need healing is your personal life.\n\nForce yourself to do the work, sit there until you finish.\n\nWorking heals you anyway."
  },
  {
    id: "069",
    title: "Startup Mindset",
    originalTitle: "Things to think constantly when building a startup",
    domain: "startup ops",
    flags: "NEW",
    text: "Talk to your users more Ship products earlier Get more feedback Hold a higher bar for who you recruit or hire"
  },
  {
    id: "070",
    title: "Brand Before Self",
    originalTitle: "Brand Before Self",
    domain: "brand positioning",
    flags: "-",
    text: "Tengo que dejar de pensar en mi y hacer lo que es mejor para la marca."
  },
  {
    id: "071",
    title: "Clarity",
    originalTitle: "Clarity",
    domain: "personal life",
    flags: "NEW",
    text: "I just had a moment of clarity, where everything felt easygoing. It might have happened because I sampled down a text so I could understand it, Having a clear mind besides getting things out of your mind by competition or deletion, it can also come from being grounded and understanding."
  },
  {
    id: "072",
    title: "The Brain",
    originalTitle: "The Brain",
    domain: "memory cognition",
    flags: "NEW",
    text: "* The only way to keep information is to use it. * The brain is designed to forget. * The brain is great at what it does, storing and retrieving relevant information that helps us understand the world. * the brain is built for efficiency and survival rather than total data storage. * The brain naturally discards repetitive or unimportant information to keep thinking fast and clear * Information only moves from temporary working memory to long-term storage if you pay close attention and make meaningful connections. * New memories stack next to old ones with similar details, which can confuse the brain and make specific facts harder to retrieve * Storage Decay: This happens over time, when we learn things but slowly forget them as time passes. * Storage decay happens most rapidly after your learn something, then slowly levels out * If we did remember everything, we would likely drown in a sea of detail and be less effective. Success comes from seeing the forest for the trees, not from memorizing all the trees. * 70% of what you learn fades after 3 months, the rest you keep it for the rest of your life. Why we make connections Energy saving: The brain is a heavy user of body energy. Linking ideas cuts down the mental work needed to react to daily life. Pattern spotting: Finding links helps us predict what happens next. How do we make connections Firing signals: When you experience something, your neurons send electrical and chemical signals. Wiring together: When two events happen at the same time, the pathways between those neurons grow stronger. Association: This process is called association. It links memories, sights, and words that share a common trait. For what purpose Learning: We group new facts with things we already know to store them easily. Problem-solving: Connecting past experiences to a current issue helps us find fast solutions. Creativity: Mixing two totally different ideas can spark a brand new invention or artistic thought."
  },
  {
    id: "073",
    title: "Ocreda Decisions",
    originalTitle: "A filter for Ocredas decisions",
    domain: "ocreda",
    flags: "OCR,NEW",
    text: "What: The only note taking app How: that proactively surface relevant notes Who: for people with too many notes Where: on their devices Why: who want to remember all their information When: in an era where generic AI is taking over"
  },
  {
    id: "074",
    title: "Art of Disagreement",
    originalTitle: "The Art of Disagreement",
    domain: "persuasion people",
    flags: "-",
    text: "There are no benefits in arguing, the goal is to have the good will of that person, to have them at your side. If you prove them wrong then, they will take that as a challenge and try to prove their argument right. Just don't care about it. You keep your mind intact, think as you like, but behave like others.\n\nAlso this could be an opportunity to listen to the facts or different point of views and maybe challenge your knowledge. Remember that we do not care about being right, we care about excellence, and to get there we need to know better, and that could come from another person.\n\nSo stay calm, listen, yield, and use diplomacy. We aim for the best outcome and to make that person feel important. Not less.\n\nSo the only way to win an argument is to avoid it, ignore it and yield."
  },
  {
    id: "075",
    title: "Seeking Greatness",
    originalTitle: "Whatever It Takes Greatness",
    domain: "discipline action",
    flags: "-",
    text: "I will do whatever is needed to achieve greatness."
  },
  {
    id: "076",
    title: "MVP Pivots",
    originalTitle: "Testing Pivots with MVPs",
    domain: "startup ops",
    flags: "-",
    text: "A pivot will require an MVP to test its hypothesis."
  },
  {
    id: "077",
    title: "Know Your Opponent",
    originalTitle: "Know Your Opponent",
    domain: "persuasion people",
    flags: "-",
    text: "Play the player, adapt to to them. Get to know their weaknesses.\n\nThen you have not to fear them."
  },
  {
    id: "078",
    title: "Life Is Not Singular",
    originalTitle: "Life is not singular",
    domain: "personal life",
    flags: "NEW",
    text: "Life is not singular things happen and they happen for you, you might fail or win, no in between. But in one month you started building with people, you happened, you asked this girl and now you are dating. So never stop trying because if you stay long enough you will succeed."
  },
  {
    id: "079",
    title: "Stay Calm",
    originalTitle: "Stay Calm Act Normal",
    domain: "stoic obstacle",
    flags: "-",
    text: "Control your nerves and act as if nothing happened"
  },
  {
    id: "080",
    title: "Grounding Imagination",
    originalTitle: "Danger of Unchecked Imagination",
    domain: "learning curiosity",
    flags: "-",
    text: "The person who lives in a world of his own in his head, loses touch with reality and what is trying to tell him.\n\nImagination if not controlled can be very dangerous.\n\nCan rob you the ability to think that he even needed to act.\n\nWe start to believe what we tell ourselves, good and bad things, which they are never a 100% true. We must live in the tangible and real.\n\nForget the world we created for ourselves, the stories, the fake feedback and live the now, act on it and create it with actual experiences."
  },
  {
    id: "081",
    title: "Fear Points to Growth",
    originalTitle: "Fear Points to Growth",
    domain: "fear ego",
    flags: "-",
    text: "Fear of your work as well as self doubt can be an ally because it tells you that what you are doing matters.\n\nThe more scared we are to do something that is what we should be doing first.\n\nIf what we are doing means nothing to us then there will be no resistance.\n\nGreat people do things that make them suffer, stretch, actually hard things that they haven't done before. And they avoid always doing for the things that don't challenge them.\n\nSo if you are paralyzed with fear is a good sign. It shows you what you have to do."
  },
  {
    id: "082",
    title: "Action Over Analysis",
    originalTitle: "Action Over Analysis",
    domain: "discipline action",
    flags: "-",
    text: "Literally do, don’t think"
  },
  {
    id: "083",
    title: "Trends",
    originalTitle: "Trends",
    domain: "brand positioning",
    flags: "NEW",
    text: "When a company is focused, meaning they know how they are as a whole and they are close to that. And they are also differentiated. It is highly effective to ride a trend as a boost to get to the top. Each industry has its own trends and micro trends that are more niched. The more trends a company uses the more power they get and the faster they can move. Be carful of when the trend dies, because the company can die with it."
  },
  {
    id: "084",
    title: "Adversity Lessons 3",
    originalTitle: "Adversity's Lessons Part Three",
    domain: "stoic obstacle",
    flags: "-",
    text: "Things adversity taught me 3/4"
  },
  {
    id: "085",
    title: "Adversity Lessons 2",
    originalTitle: "Adversity's Lessons Part Two",
    domain: "stoic obstacle",
    flags: "-",
    text: "Things adversity taught me 2/4"
  },
  {
    id: "086",
    title: "Market Positioning",
    originalTitle: "Broad and narrow market positions",
    domain: "brand positioning",
    flags: "NEW",
    text: "The bigger the market the narrower or focused your company should be, meaning you should focus on a segment of that market and serve one tribe before expanding .And the opposite for smaller markets is true where there is little competition, meaning you can be more general and not sell one thing. Small companies place themselves in the intersection of many markets to seem like they are different, but they end up serving no-one because those markets are owned by a lot of competition or focused companies. Monopolies dominate one market and they say they place themselves in many markets where they don't dominate to make seem that they don't dominate any."
  },
  {
    id: "087",
    title: "Pivoting Costs",
    originalTitle: "Brand Pivoting Costs Worth It",
    domain: "brand positioning",
    flags: "-",
    text: "In the process of creating the brand, even more at the start of it, you can always pivote. Obviously it got costs. But they are just a compromise for the future of the company."
  },
  {
    id: "088",
    title: "Customer Research",
    originalTitle: "Customer Research and Sizing",
    domain: "startup ops",
    flags: "-",
    text: "1. Understanding customers (qualitative)\nUser interviews / surveys: Typeform, Google Forms, SurveyMonkey\nBehavioral insight: Hotjar, FullStory (session recordings, heatmaps)\n\n2. Sizing the market (quantitative)\nIndustry data: Statista, IBISWorld, Gartner, CB Insights\nSearch demand: Google Trends, Ahrefs, SEMrush (keyword volume = proxy for interest)\n\n3. Competitive analysis\nSimilarWeb: traffic and engagement estimates for competitors\nApp Annie/data.ai: app store rankings, downloads"
  },
  {
    id: "089",
    title: "Practice",
    originalTitle: "Practice Makes Perfect",
    domain: "learning curiosity",
    flags: "-",
    text: "The best way to get better is practice."
  },
  {
    id: "090",
    title: "Marketing Rules",
    originalTitle: "Tips on marketing that never change",
    domain: "brand positioning",
    flags: "NEW",
    text: "There has to be no distance between you and the end buyer, stay as close as possible for feedback No argument can beat a dramatic demonstration Not to buy my product but whet you can do for the customer Talk in peoples service, what appeals to them about your business You don't sell on the problem, you focus on the solution Forget yourself entirely, seek in every word to improve your good impression Every marketing prospect should be aim as if you were talking to a single person in front of you"
  },
  {
    id: "091",
    title: "Friendly Warmth",
    originalTitle: "Building Trust Through Warmth",
    domain: "persuasion people",
    flags: "-",
    text: "Always start in a friendly way, make people think you are their sincere friend and you will find them moew wasly to approach."
  },
  {
    id: "092",
    title: "Void and Work",
    originalTitle: "Void Filling and True Work",
    domain: "meaning mortality",
    flags: "-",
    text: "Unhappiness can also come as resistance, feeling board, in misery, or vices. This will lead to being a full time consumer of whatever can fill our void.\n\nThis sounds like life, but it is not.\n\nThe only way to unfocused mentality is by doing the work."
  },
  {
    id: "093",
    title: "Brand Naming",
    originalTitle: "Your brands name",
    domain: "brand positioning",
    flags: "NEW",
    text: "A name and/or the logo are the companies most valuable assets. A good name can accelerate the brands building process. A good name can differentiate from the competition. And if the logo it is the same as the name then recognition will be easier. Sometimes it is so good, that people use it to describe the act of doing something. Here are some tips for crafting a name: 1. Different than those of competitors 2. Brief, four syllables 3. Appropriate to what the companies is 4. Easy to spell 5. Satisfying to pronounce 6. Suitable for \"brandplay\" 7. Legally defensible"
  },
  {
    id: "094",
    title: "Deep Curiosity",
    originalTitle: "Deep Curiosity and Observation",
    domain: "learning curiosity",
    flags: "-",
    text: "Aim to have a deep curiosity and intense observation of things.\n\nPause to look at things and ask questions.\n\nAsk about even the most common things or the things we take for granted, like why is the sky blue type of question. Or why does the fish in water swifter more than birds in air.\n\nThe root of all this is to be curious, passionate, and always filled with wonder."
  },
  {
    id: "095",
    title: "Non-Intrusive Marketing",
    originalTitle: "Marketing shouldnt be intrusive",
    domain: "brand positioning",
    flags: "NEW",
    text: "Marketing shouldn't be intrusive, aim for trust among tribes of people.\n\nThey have to ask themselves, \"If I buy this, what does it make me?\" It should be like a conversation, more of an invitation to belong to the tribe. So you must be clear with what you say, because people only catch one element from the message. Branding: Customers understand who you are and what you do, without you bombarding them with ads."
  },
  {
    id: "096",
    title: "Brand Enemy",
    originalTitle: "Your brands enemy",
    domain: "brand positioning",
    flags: "NEW",
    text: "You cannot please everyone, the best way to show how radically different you are, pick a fight with the biggest competitor you can find. It does not have to be a company, it can be a way of doing things, anything for that matter. The goal is not to fight but to have the biggest contrast possible, so you stand out. Build a a following for this revolution."
  },
  {
    id: "097",
    title: "Resisting Conformity",
    originalTitle: "Conformity Costs Competitive Edge",
    domain: "fear ego",
    flags: "-",
    text: "Most people do whatever most people they hang out with do. This mimetic behavior is usually a mistake—if you're doing the same thing everyone else is doing, you will not be hard to compete with."
  },
  {
    id: "098",
    title: "Legacy",
    originalTitle: "Legacy Through Creation",
    domain: "meaning mortality",
    flags: "-",
    text: "Everyone dies and when we die, if we are lucky enough to do great things, to create something and impact the world in some way, maybe there we can be remembered. So what matters is what we can do for the rest of humanity while we are here, with the limited time we are offered. Like entrepreneurs with their creations, authors with their books, singers with their songs. We are not remembered as an individual, but as a creator who left a gift to the world, that is when people know who we are, even though we never met."
  },
  {
    id: "099",
    title: "Speed of Learning",
    originalTitle: "Speed of Customer Learning",
    domain: "startup ops",
    flags: "-",
    text: "The essential competitive advantage from startups is the ability to learn faster from customer"
  },
  {
    id: "100",
    title: "Shared Human Experience",
    originalTitle: "Universal Human Experience",
    domain: "meaning mortality",
    flags: "-",
    text: "Everyone you come across is playing the same game of life, we all have the same stake, adapt to their reality."
  }
];

function sanitizeFilename(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// 1. Ensure notes directory exists and is clean
const targetDir = path.resolve(__dirname, '..', 'notes');
if (fs.existsSync(targetDir)) {
  const existingFiles = fs.readdirSync(targetDir);
  for (const f of existingFiles) {
    fs.unlinkSync(path.join(targetDir, f));
  }
} else {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 2. Write each note as an individual text file with short title
console.log(`Writing 100 individual text files with short titles to ${targetDir}...`);
for (const n of notes) {
  const slug = sanitizeFilename(n.title);
  const fileName = `${n.id}-${slug}.txt`;
  const filePath = path.join(targetDir, fileName);
  
  // Format note: short title on line 1 followed by content
  const fileContent = `${n.title}\n\n${n.text}\n`;
  fs.writeFileSync(filePath, fileContent, 'utf8');
}

// 3. Write all-notes.txt (separated by ---)
const allNotesTxtPath = path.join(targetDir, 'all-notes.txt');
const allNotesTxt = notes.map((n) => `${n.title}\n\n${n.text}`).join('\n\n---\n\n');
fs.writeFileSync(allNotesTxtPath, allNotesTxt, 'utf8');

// 4. Write all-notes.json (array of strings)
const allNotesJsonPath = path.join(targetDir, 'all-notes.json');
const allNotesJson = notes.map((n) => `${n.title}\n\n${n.text}`);
fs.writeFileSync(allNotesJsonPath, JSON.stringify(allNotesJson, null, 2), 'utf8');

// 5. Write notes-metadata.json (rich metadata with id, short title, original title, domain, flags, text)
const metadataJsonPath = path.join(targetDir, 'notes-metadata.json');
fs.writeFileSync(metadataJsonPath, JSON.stringify(notes, null, 2), 'utf8');

console.log('Successfully regenerated all 100 note files with clean, short titles!');
