/* ==========================================================================
   SCRIPTURE — for members who choose the Blended or Christian path
   Bible text: King James Version and World English Bible, both in the public
   domain. Verses are quoted exactly from those translations.
   The "When you're struggling" list follows a graphic shared by
   @fishersofmen21 ("Defeat the Demons That Target You"), extended for this
   practice.
   ========================================================================== */
window.SOV = window.SOV || {};
SOV.SCRIPTURE = (function () {
  const VERSES = {
    "Romans 8:1": {
      "kjv": "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.",
      "web": "There is therefore now no condemnation to those who are in Christ Jesus, who don’t walk according to the flesh, but according to the Spirit."
    },
    "Isaiah 40:29": {
      "kjv": "He giveth power to the faint; and to them that have no might he increaseth strength.",
      "web": "He gives power to the weak. He increases the strength of him who has no might."
    },
    "Revelation 21:4": {
      "kjv": "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.",
      "web": "He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away."
    },
    "1 Corinthians 14:33": {
      "kjv": "For God is not the author of confusion, but of peace, as in all churches of the saints.",
      "web": "for God is not a God of confusion, but of peace, as in all the assemblies of the saints."
    },
    "Psalm 42:11": {
      "kjv": "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.",
      "web": "Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him, the saving help of my countenance, and my God."
    },
    "Isaiah 41:10": {
      "kjv": "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
      "web": "Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness."
    },
    "Romans 15:13": {
      "kjv": "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.",
      "web": "Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope, in the power of the Holy Spirit."
    },
    "Exodus 33:14": {
      "kjv": "And he said, My presence shall go with thee, and I will give thee rest.",
      "web": "He said, “My presence will go with you, and I will give you rest.”"
    },
    "2 Timothy 1:7": {
      "kjv": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
      "web": "For God didn’t give us a spirit of fear, but of power, love, and self-control."
    },
    "Matthew 5:4": {
      "kjv": "Blessed are they that mourn: for they shall be comforted.",
      "web": "Blessed are those who mourn, for they shall be comforted."
    },
    "Philippians 4:6-7": {
      "kjv": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
      "web": "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus."
    },
    "James 1:5-6": {
      "kjv": "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him. But let him ask in faith, nothing wavering. For he that wavereth is like a wave of the sea driven with the wind and tossed.",
      "web": "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him. But let him ask in faith, without any doubting, for he who doubts is like a wave of the sea, driven by the wind and tossed."
    },
    "2 Corinthians 4:8-9": {
      "kjv": "We are troubled on every side, yet not distressed; we are perplexed, but not in despair; Persecuted, but not forsaken; cast down, but not destroyed;",
      "web": "We are pressed on every side, yet not crushed; perplexed, yet not to despair; pursued, yet not forsaken; struck down, yet not destroyed;"
    },
    "Matthew 11:28-30": {
      "kjv": "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.",
      "web": "“Come to me, all you who labor and are heavily burdened, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and humble in heart; and you will find rest for your souls. For my yoke is easy, and my burden is light.”"
    },
    "Psalm 68:6": {
      "kjv": "God setteth the solitary in families: he bringeth out those which are bound with chains: but the rebellious dwell in a dry land.",
      "web": "God sets the lonely in families. He brings out the prisoners with singing, but the rebellious dwell in a sun-scorched land."
    },
    "Psalm 147:3": {
      "kjv": "He healeth the broken in heart, and bindeth up their wounds.",
      "web": "He heals the broken in heart, and binds up their wounds."
    },
    "Hebrews 13:5": {
      "kjv": "Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.",
      "web": "Be free from the love of money, content with such things as you have, for he has said, “I will in no way leave you, neither will I in any way forsake you.”"
    },
    "Ephesians 4:26-27": {
      "kjv": "Be ye angry, and sin not: let not the sun go down upon your wrath: Neither give place to the devil.",
      "web": "“Be angry, and don’t sin.” Don’t let the sun go down on your wrath, and don’t give place to the devil."
    },
    "Matthew 6:34": {
      "kjv": "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
      "web": "Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient."
    },
    "John 16:20": {
      "kjv": "Verily, verily, I say unto you, That ye shall weep and lament, but the world shall rejoice: and ye shall be sorrowful, but your sorrow shall be turned into joy.",
      "web": "Most certainly I tell you that you will weep and lament, but the world will rejoice. You will be sorrowful, but your sorrow will be turned into joy."
    },
    "1 Corinthians 10:13": {
      "kjv": "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.",
      "web": "No temptation has taken you except what is common to man. God is faithful, who will not allow you to be tempted above what you are able, but will with the temptation also make the way of escape, that you may be able to endure it."
    },
    "2 Timothy 2:22": {
      "kjv": "Flee also youthful lusts: but follow righteousness, faith, charity, peace, with them that call on the Lord out of a pure heart.",
      "web": "Flee from youthful lusts; but pursue righteousness, faith, love, and peace with those who call on the Lord out of a pure heart."
    },
    "Proverbs 24:16": {
      "kjv": "For a just man falleth seven times, and riseth up again: but the wicked shall fall into mischief.",
      "web": "for a righteous man falls seven times and rises up again; but the wicked are overthrown by calamity."
    },
    "Lamentations 3:22-23": {
      "kjv": "It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
      "web": "It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning. Great is your faithfulness."
    },
    "1 John 1:9": {
      "kjv": "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
      "web": "If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness."
    },
    "Galatians 5:16": {
      "kjv": "This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh.",
      "web": "But I say, walk by the Spirit, and you won’t fulfill the lust of the flesh."
    },
    "James 1:12": {
      "kjv": "Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him.",
      "web": "Blessed is a person who endures temptation, for when he has been approved, he will receive the crown of life, which the Lord promised to those who love him."
    },
    "Genesis 1:27": {
      "kjv": "So God created man in his own image, in the image of God created he him; male and female created he them.",
      "web": "God created man in his own image. In God’s image he created him; male and female he created them."
    },
    "Genesis 1:31": {
      "kjv": "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.",
      "web": "God saw everything that he had made, and, behold, it was very good. There was evening and there was morning, a sixth day."
    },
    "Song of Solomon 8:6-7": {
      "kjv": "Set me as a seal upon thine heart, as a seal upon thine arm: for love is strong as death; jealousy is cruel as the grave: the coals thereof are coals of fire, which hath a most vehement flame. Many waters cannot quench love, neither can the floods drown it: if a man would give all the substance of his house for love, it would utterly be contemned.",
      "web": "Set me as a seal on your heart, as a seal on your arm; for love is strong as death. Jealousy is as cruel as Sheol. Its flashes are flashes of fire, a very flame of Yahweh. Many waters can’t quench love, neither can floods drown it. If a man would give all the wealth of his house for love, he would be utterly scorned."
    },
    "Galatians 5:22-23": {
      "kjv": "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.",
      "web": "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith, gentleness, and self-control. Against such things there is no law."
    },
    "1 Corinthians 9:25": {
      "kjv": "And every man that striveth for the mastery is temperate in all things. Now they do it to obtain a corruptible crown; but we an incorruptible.",
      "web": "Every man who strives in the games exercises self-control in all things. Now they do it to receive a corruptible crown, but we an incorruptible."
    },
    "Proverbs 25:28": {
      "kjv": "He that hath no rule over his own spirit is like a city that is broken down, and without walls.",
      "web": "Like a city that is broken down and without walls is a man whose spirit is without restraint."
    },
    "Titus 2:11-12": {
      "kjv": "For the grace of God that bringeth salvation hath appeared to all men, Teaching us that, denying ungodliness and worldly lusts, we should live soberly, righteously, and godly, in this present world;",
      "web": "For the grace of God has appeared, bringing salvation to all men, instructing us to the intent that, denying ungodliness and worldly lusts, we would live soberly, righteously, and godly in this present age;"
    },
    "1 Thessalonians 4:3-5": {
      "kjv": "For this is the will of God, even your sanctification, that ye should abstain from fornication: That every one of you should know how to possess his vessel in sanctification and honour; Not in the lust of concupiscence, even as the Gentiles which know not God:",
      "web": "For this is the will of God: your sanctification, that you abstain from sexual immorality, that each one of you know how to control his own body in sanctification and honor, not in the passion of lust, even as the Gentiles who don’t know God,"
    },
    "1 Corinthians 6:18-20": {
      "kjv": "Flee fornication. Every sin that a man doeth is without the body; but he that committeth fornication sinneth against his own body. What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God’s.",
      "web": "Flee sexual immorality! “Every sin that a man does is outside the body,” but he who commits sexual immorality sins against his own body. Or don’t you know that your body is a temple of the Holy Spirit who is in you, whom you have from God? You are not your own, for you were bought with a price. Therefore glorify God in your body and in your spirit, which are God’s."
    },
    "Romans 12:1": {
      "kjv": "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.",
      "web": "Therefore I urge you, brothers, by the mercies of God, to present your bodies a living sacrifice, holy, acceptable to God, which is your spiritual service."
    },
    "Genesis 2:7": {
      "kjv": "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.",
      "web": "Yahweh God formed man from the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul."
    },
    "Job 33:4": {
      "kjv": "The spirit of God hath made me, and the breath of the Almighty hath given me life.",
      "web": "The Spirit of God has made me, and the breath of the Almighty gives me life."
    },
    "John 20:22": {
      "kjv": "And when he had said this, he breathed on them, and saith unto them, Receive ye the Holy Ghost:",
      "web": "When he had said this, he breathed on them, and said to them, “Receive the Holy Spirit!”"
    },
    "Psalm 150:6": {
      "kjv": "Let every thing that hath breath praise the LORD. Praise ye the LORD.",
      "web": "Let everything that has breath praise Yah! Praise Yah!"
    },
    "Romans 12:2": {
      "kjv": "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
      "web": "Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God."
    },
    "Philippians 4:8": {
      "kjv": "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
      "web": "Finally, brothers, whatever things are true, whatever things are honorable, whatever things are just, whatever things are pure, whatever things are lovely, whatever things are of good report: if there is any virtue and if there is any praise, think about these things."
    },
    "2 Corinthians 10:5": {
      "kjv": "Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;",
      "web": "throwing down imaginations and every high thing that is exalted against the knowledge of God and bringing every thought into captivity to the obedience of Christ,"
    },
    "Colossians 3:2": {
      "kjv": "Set your affection on things above, not on things on the earth.",
      "web": "Set your mind on the things that are above, not on the things that are on the earth."
    },
    "Proverbs 4:23": {
      "kjv": "Keep thy heart with all diligence; for out of it are the issues of life.",
      "web": "Keep your heart with all diligence, for out of it is the wellspring of life."
    },
    "Ephesians 6:10-11": {
      "kjv": "Finally, my brethren, be strong in the Lord, and in the power of his might. Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.",
      "web": "Finally, be strong in the Lord, and in the strength of his might. Put on the whole armor of God, that you may be able to stand against the wiles of the devil."
    },
    "Matthew 6:22": {
      "kjv": "The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light.",
      "web": "The lamp of the body is the eye. If therefore your eye is sound, your whole body will be full of light."
    },
    "Psalm 101:3": {
      "kjv": "I will set no wicked thing before mine eyes: I hate the work of them that turn aside; it shall not cleave to me.",
      "web": "I will set no vile thing before my eyes. I hate the deeds of faithless men. They will not cling to me."
    },
    "Psalm 46:10": {
      "kjv": "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
      "web": "“Be still, and know that I am God. I will be exalted among the nations. I will be exalted in the earth.”"
    },
    "Psalm 1:2": {
      "kjv": "But his delight is in the law of the LORD; and in his law doth he meditate day and night.",
      "web": "but his delight is in Yahweh’s law. On his law he meditates day and night."
    },
    "Joshua 1:8": {
      "kjv": "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
      "web": "This book of the law shall not depart from your mouth, but you shall meditate on it day and night, that you may observe to do according to all that is written in it; for then you shall make your way prosperous, and then you shall have good success."
    },
    "Psalm 19:14": {
      "kjv": "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.",
      "web": "Let the words of my mouth and the meditation of my heart be acceptable in your sight, Yahweh, my rock, and my redeemer."
    },
    "Isaiah 26:3": {
      "kjv": "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.",
      "web": "You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you."
    },
    "Exodus 31:3": {
      "kjv": "And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,",
      "web": "I have filled him with the Spirit of God, in wisdom, and in understanding, and in knowledge, and in all kinds of workmanship,"
    },
    "Colossians 3:23": {
      "kjv": "And whatsoever ye do, do it heartily, as to the Lord, and not unto men;",
      "web": "And whatever you do, work heartily, as for the Lord, and not for men,"
    },
    "Ephesians 2:10": {
      "kjv": "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
      "web": "For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them."
    },
    "Matthew 5:14-16": {
      "kjv": "Ye are the light of the world. A city that is set on an hill cannot be hid. Neither do men light a candle, and put it under a bushel, but on a candlestick; and it giveth light unto all that are in the house. Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
      "web": "You are the light of the world. A city located on a hill can’t be hidden. Neither do you light a lamp, and put it under a measuring basket, but on a stand; and it shines to all who are in the house. Even so, let your light shine before men; that they may see your good works, and glorify your Father who is in heaven."
    },
    "2 Corinthians 3:18": {
      "kjv": "But we all, with open face beholding as in a glass the glory of the Lord, are changed into the same image from glory to glory, even as by the Spirit of the LORD.",
      "web": "But we all, with unveiled face seeing the glory of the Lord as in a mirror, are transformed into the same image from glory to glory, even as from the Lord, the Spirit."
    },
    "Hebrews 13:4": {
      "kjv": "Marriage is honourable in all, and the bed undefiled: but whoremongers and adulterers God will judge.",
      "web": "Let marriage be held in honor among all, and let the bed be undefiled; but God will judge the sexually immoral and adulterers."
    },
    "1 Corinthians 7:3-5": {
      "kjv": "Let the husband render unto the wife due benevolence: and likewise also the wife unto the husband. The wife hath not power of her own body, but the husband: and likewise also the husband hath not power of his own body, but the wife. Defraud ye not one the other, except it be with consent for a time, that ye may give yourselves to fasting and prayer; and come together again, that Satan tempt you not for your incontinency.",
      "web": "Let the husband give his wife the affection owed her, and likewise also the wife her husband. The wife doesn’t have authority over her own body, but the husband. Likewise also the husband doesn’t have authority over his own body, but the wife. Don’t deprive one another, unless it is by consent for a season, that you may give yourselves to fasting and prayer, and may be together again, that Satan doesn’t tempt you because of your lack of self-control."
    },
    "Proverbs 5:18-19": {
      "kjv": "Let thy fountain be blessed: and rejoice with the wife of thy youth. Let her be as the loving hind and pleasant roe; let her breasts satisfy thee at all times; and be thou ravished always with her love.",
      "web": "Let your spring be blessed. Rejoice in the wife of your youth. A loving doe and a graceful deer— let her breasts satisfy you at all times. Be captivated always with her love."
    },
    "Genesis 2:24": {
      "kjv": "Therefore shall a man leave his father and his mother, and shall cleave unto his wife: and they shall be one flesh.",
      "web": "Therefore a man will leave his father and his mother, and will join with his wife, and they will be one flesh."
    },
    "Matthew 6:17-18": {
      "kjv": "But thou, when thou fastest, anoint thine head, and wash thy face; That thou appear not unto men to fast, but unto thy Father which is in secret: and thy Father, which seeth in secret, shall reward thee openly.",
      "web": "But you, when you fast, anoint your head, and wash your face; so that you are not seen by men to be fasting, but by your Father who is in secret, and your Father, who sees in secret, will reward you."
    },
    "1 Corinthians 9:27": {
      "kjv": "But I keep under my body, and bring it into subjection: lest that by any means, when I have preached to others, I myself should be a castaway.",
      "web": "but I beat my body and bring it into submission, lest by any means, after I have preached to others, I myself should be rejected."
    },
    "Philippians 3:13-14": {
      "kjv": "Brethren, I count not myself to have apprehended: but this one thing I do, forgetting those things which are behind, and reaching forth unto those things which are before, I press toward the mark for the prize of the high calling of God in Christ Jesus.",
      "web": "Brothers, I don’t regard myself as yet having taken hold, but one thing I do: forgetting the things which are behind, and stretching forward to the things which are before, I press on toward the goal for the prize of the high calling of God in Christ Jesus."
    },
    "Mark 1:35": {
      "kjv": "And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.",
      "web": "Early in the morning, while it was still dark, he rose up and went out, and departed into a deserted place, and prayed there."
    },
    "Matthew 6:6": {
      "kjv": "But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret; and thy Father which seeth in secret shall reward thee openly.",
      "web": "But you, when you pray, enter into your inner room, and having shut your door, pray to your Father who is in secret, and your Father who sees in secret will reward you openly."
    },
    "Psalm 63:6": {
      "kjv": "When I remember thee upon my bed, and meditate on thee in the night watches.",
      "web": "when I remember you on my bed, and think about you in the night watches."
    },
    "Psalm 119:148": {
      "kjv": "Mine eyes prevent the night watches, that I might meditate in thy word.",
      "web": "My eyes stay open through the night watches, that I might meditate on your word."
    },
    "Luke 18:13": {
      "kjv": "And the publican, standing afar off, would not lift up so much as his eyes unto heaven, but smote upon his breast, saying, God be merciful to me a sinner.",
      "web": "But the tax collector, standing far away, wouldn’t even lift up his eyes to heaven, but beat his breast, saying, ‘God, be merciful to me, a sinner!’"
    },
    "1 Thessalonians 5:17": {
      "kjv": "Pray without ceasing.",
      "web": "Pray without ceasing."
    },
    "Romans 8:15": {
      "kjv": "For ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father.",
      "web": "For you didn’t receive the spirit of bondage again to fear, but you received the Spirit of adoption, by whom we cry, “Abba! Father!”"
    },
    "Psalm 119:105": {
      "kjv": "Thy word is a lamp unto my feet, and a light unto my path.",
      "web": "Your word is a lamp to my feet, and a light for my path."
    },
    "Psalm 139:23-24": {
      "kjv": "Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting.",
      "web": "Search me, God, and know my heart. Try me, and know my thoughts. See if there is any wicked way in me, and lead me in the everlasting way."
    },
    "Lamentations 3:40": {
      "kjv": "Let us search and try our ways, and turn again to the LORD.",
      "web": "Let us search and try our ways, and turn again to Yahweh."
    },
    "Psalm 19:1": {
      "kjv": "The heavens declare the glory of God; and the firmament sheweth his handywork.",
      "web": "The heavens declare the glory of God. The expanse shows his handiwork."
    },
    "Psalm 24:1": {
      "kjv": "The earth is the LORD’s, and the fulness thereof; the world, and they that dwell therein.",
      "web": "The earth is Yahweh’s, with its fullness; the world, and those who dwell in it."
    },
    "1 Kings 19:12": {
      "kjv": "And after the earthquake a fire; but the LORD was not in the fire: and after the fire a still small voice.",
      "web": "After the earthquake a fire passed; but Yahweh was not in the fire. After the fire, there was a still small voice."
    },
    "Isaiah 40:31": {
      "kjv": "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
      "web": "but those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint."
    },
    "Matthew 26:41": {
      "kjv": "Watch and pray, that ye enter not into temptation: the spirit indeed is willing, but the flesh is weak.",
      "web": "Watch and pray, that you don’t enter into temptation. The spirit indeed is willing, but the flesh is weak."
    },
    "Psalm 51:10": {
      "kjv": "Create in me a clean heart, O God; and renew a right spirit within me.",
      "web": "Create in me a clean heart, O God. Renew a right spirit within me."
    },
    "Romans 6:12-13": {
      "kjv": "Let not sin therefore reign in your mortal body, that ye should obey it in the lusts thereof. Neither yield ye your members as instruments of unrighteousness unto sin: but yield yourselves unto God, as those that are alive from the dead, and your members as instruments of righteousness unto God.",
      "web": "Therefore don’t let sin reign in your mortal body, that you should obey it in its lusts. Also, do not present your members to sin as instruments of unrighteousness, but present yourselves to God as alive from the dead, and your members as instruments of righteousness to God."
    }
  };

  const TRANSLATIONS = { kjv: "King James Version", web: "World English Bible" };
  const SHORT = { kjv: "KJV", web: "WEB" };

  /* ---------------- When you're struggling ---------------- */
  const STRUGGLES = [
    { id: "temptation", name: "Temptation", refs: ["1 Corinthians 10:13", "Matthew 26:41"] },
    { id: "lust", name: "Lust", refs: ["2 Timothy 2:22", "Galatians 5:16"] },
    { id: "relapse", name: "Relapse", refs: ["Proverbs 24:16", "Lamentations 3:22-23"] },
    { id: "guilt", name: "Guilt", refs: ["1 John 1:9", "Psalm 51:10"] },
    { id: "shame", name: "Shame", refs: ["Romans 8:1"] },
    { id: "exhaustion", name: "Exhaustion", refs: ["Isaiah 40:29"] },
    { id: "pain", name: "Pain", refs: ["Revelation 21:4"] },
    { id: "confusion", name: "Confusion", refs: ["1 Corinthians 14:33"] },
    { id: "depression", name: "Depression", refs: ["Psalm 42:11"] },
    { id: "fear", name: "Fear", refs: ["Isaiah 41:10"] },
    { id: "hopelessness", name: "Hopelessness", refs: ["Romans 15:13"] },
    { id: "stress", name: "Stress", refs: ["Exodus 33:14"] },
    { id: "insecurity", name: "Insecurity", refs: ["2 Timothy 1:7"] },
    { id: "grief", name: "Grief", refs: ["Matthew 5:4"] },
    { id: "anxiety", name: "Anxiety", refs: ["Philippians 4:6-7"] },
    { id: "doubt", name: "Doubt", refs: ["James 1:5-6"] },
    { id: "despair", name: "Despair", refs: ["2 Corinthians 4:8-9"] },
    { id: "burden", name: "Burden", refs: ["Matthew 11:28-30"] },
    { id: "loneliness", name: "Loneliness", refs: ["Psalm 68:6"] },
    { id: "trauma", name: "Trauma", refs: ["Psalm 147:3"] },
    { id: "isolation", name: "Isolation", refs: ["Hebrews 13:5"] },
    { id: "anger", name: "Anger", refs: ["Ephesians 4:26-27"] },
    { id: "worry", name: "Worry", refs: ["Matthew 6:34"] },
    { id: "sadness", name: "Sadness", refs: ["John 16:20"] },
    { id: "weariness", name: "Weariness", refs: ["Isaiah 40:31"] }
  ];
  const STRUGGLES_CREDIT = "Inspired by “Defeat the Demons That Target You” from @fishersofmen21.";

  /* ---------------- Sovereign's teachings, cross-referenced ---------------- */
  const TEACHINGS = [
    { id: "t-gift", title: "Desire is a gift", teaching: "What sexual energy is",
      text: "Sovereign treats sexual energy as life force, not as something shameful. Scripture begins in the same place: God made us male and female, and called what he made very good. The Song of Solomon calls love “strong as death,” a flame many waters cannot quench. The aim is not to kill desire but to honour it and give it its right place.",
      refs: ["Genesis 1:27", "Genesis 1:31", "Song of Solomon 8:6-7"], link: { type: "lesson", id: "what-is-sexual-energy" } },
    { id: "t-temperance", title: "Self-control is a fruit", teaching: "Retention and restraint",
      text: "Retention is Sovereign's discipline of not spending energy carelessly. Scripture names self-control (temperance) as a fruit of the Spirit, grown rather than forced, and compares it to an athlete's training for a crown that lasts. A person without it is “like a city that is broken down, and without walls.”",
      refs: ["Galatians 5:22-23", "1 Corinthians 9:25", "Proverbs 25:28", "Titus 2:11-12", "1 Thessalonians 4:3-5"], link: { type: "lesson", id: "science-of-retention" } },
    { id: "t-temple", title: "The body is a temple", teaching: "Grounding and caring for the body",
      text: "Sleep, nourishment, earth contact and strength training are Sovereign's foundation. Paul's reason for caring for the body is that it is the dwelling place of the Holy Spirit, bought with a price, and offered back to God as “a living sacrifice.”",
      refs: ["1 Corinthians 6:18-20", "Romans 12:1", "Psalm 24:1"], link: { type: "lesson", id: "grounding-bioelectricity" } },
    { id: "t-breath", title: "The breath of life", teaching: "Breathwork",
      text: "Breath is the centre of Sovereign's practice. In Scripture, breath is where life begins: God breathed into Adam's nostrils, the Spirit of God gives breath, and the risen Christ breathed on his disciples as he gave them the Holy Spirit. Conscious breathing can be a way of receiving that life again.",
      refs: ["Genesis 2:7", "Job 33:4", "John 20:22", "Psalm 150:6"], link: { type: "pacer", id: "jesus-prayer" } },
    { id: "t-renewal", title: "Transformed by renewing the mind", teaching: "Transmutation",
      text: "Transmutation means redirecting a raw urge into something higher. Paul describes the same movement: not conformed, but transformed by the renewing of the mind, taking every thought captive, and setting the mind on what is true, pure and lovely. The energy is not destroyed; it is offered, “as instruments of righteousness unto God.”",
      refs: ["Romans 12:2", "2 Corinthians 10:5", "Philippians 4:8", "Colossians 3:2", "Romans 6:12-13"], link: { type: "lesson", id: "transmutation" } },
    { id: "t-guard", title: "Guard your heart", teaching: "Protecting your energy and attention",
      text: "Sovereign teaches you to protect your field and limit what comes through the little black box in your pocket. Proverbs puts it simply: guard your heart, for out of it flow the issues of life. Jesus calls the eye the lamp of the body, and the psalmist resolves to set no wicked thing before his eyes.",
      refs: ["Proverbs 4:23", "Matthew 6:22", "Psalm 101:3", "Ephesians 6:10-11"], link: { type: "guide", id: "stimulation-fast" } },
    { id: "t-stillness", title: "Be still", teaching: "Meditation and going inward",
      text: "Sovereign's meditation practice is about stillness under the noise of thought. Scripture commands it (“Be still, and know that I am God”) and describes meditating on God's word day and night. Elijah found God not in the wind, earthquake or fire, but in “a still small voice.”",
      refs: ["Psalm 46:10", "1 Kings 19:12", "Psalm 1:2", "Joshua 1:8", "Isaiah 26:3", "Psalm 19:14"], link: { type: "pacer", id: "be-still" } },
    { id: "t-create", title: "Created to create", teaching: "Creative channels",
      text: "Sovereign channels cultivated energy into creative work. Scripture sees skill and craft as gifts of the Spirit (Bezalel was “filled with the spirit of God… in all manner of workmanship”) and calls us God's workmanship, made for good works. Whatever you make, make it “heartily, as to the Lord.”",
      refs: ["Exodus 31:3", "Ephesians 2:10", "Colossians 3:23"], link: { type: "guide", id: "creative-first-hour" } },
    { id: "t-light", title: "Let your light shine", teaching: "Your energetic signature",
      text: "Sovereign speaks of the signature you carry into every room. Jesus speaks of light: a city on a hill cannot be hid, so let your light shine so that others see and glorify God. Paul describes being changed “from glory to glory” as we behold the Lord.",
      refs: ["Matthew 5:14-16", "2 Corinthians 3:18"], link: { type: "lesson", id: "energetic-signature" } },
    { id: "t-union", title: "The two become one", teaching: "Practising with a partner",
      text: "Scripture honours married intimacy as good and undefiled, a joy to delight in. It is also the closest biblical parallel to retention within marriage: Paul allows a couple to abstain “with consent for a time” to give themselves to fasting and prayer. He also warns them not to deprive each other otherwise. Any shared practice is agreed together, never imposed.",
      refs: ["Genesis 2:24", "Hebrews 13:4", "Proverbs 5:18-19", "1 Corinthians 7:3-5"], link: { type: "guide", id: "partner-practice" } },
    { id: "t-fasting", title: "Fasting and discipline", teaching: "Discipline of the body",
      text: "Sovereign's protocols ask for steady discipline. Jesus assumes his followers will fast (“when thou fastest”), quietly and without show. Paul disciplines his body so it serves rather than rules him. Those who wait on the Lord “shall renew their strength.”",
      refs: ["Matthew 6:17-18", "1 Corinthians 9:27", "Isaiah 40:31"] },
    { id: "t-watch", title: "The night watches", teaching: "Rising early and the quiet hours",
      text: "Many in this practice rise in the small hours to sit in silence. Christians have kept the night watch for centuries. Jesus rose “a great while before day” to pray alone, and the psalmist meditated on God in the night watches. Go into your closet, shut the door, and pray in secret.",
      refs: ["Mark 1:35", "Psalm 63:6", "Psalm 119:148", "Matthew 6:6"] },
    { id: "t-temptation", title: "When the urge comes", teaching: "Redirecting a surge",
      text: "Sovereign's 90-second redirect meets an urge with breath and movement. Scripture promises that no temptation comes without a way of escape. It tells us to flee and pursue, to walk in the Spirit, and to watch and pray, “for the spirit indeed is willing, but the flesh is weak.”",
      refs: ["1 Corinthians 10:13", "2 Timothy 2:22", "Galatians 5:16", "Matthew 26:41", "James 1:12"], link: { type: "guide", id: "surge-redirect" } },
    { id: "t-rise", title: "Get back up", teaching: "Setbacks and releases",
      text: "Sovereign counts honestly and without judgement, and every day is a new beginning. Scripture says it first: a just man falls seven times and rises up again, God's mercies are new every morning, and confession meets forgiveness. Forget what is behind and press on.",
      refs: ["Proverbs 24:16", "Lamentations 3:22-23", "1 John 1:9", "Psalm 51:10", "Philippians 3:13-14"] }
  ];

  /* ---------------- Breath prayers for the pacer ---------------- */
  const PACER = {
    "jesus-prayer": { title: "The Jesus Prayer", note: "The prayer of the heart, joined to the breath as the Desert Fathers taught. Say it silently and unhurried.",
      phases: [{ label: "Inhale", sub: "Lord Jesus Christ, Son of God,", s: 5, grow: 1 }, { label: "Exhale", sub: "have mercy on me.", s: 6, grow: 0 }] },
    "be-still": { title: "Be Still", note: "Psalm 46:10, shortened with each breath until only “Be” remains. Then rest in the silence.",
      phases: [
        { label: "Inhale", sub: "Be still, and know", s: 4, grow: 1 }, { label: "Exhale", sub: "that I am God.", s: 6, grow: 0 },
        { label: "Inhale", sub: "Be still, and know", s: 4, grow: 1 }, { label: "Exhale", sub: "that I am.", s: 6, grow: 0 },
        { label: "Inhale", sub: "Be still,", s: 4, grow: 1 }, { label: "Exhale", sub: "and know.", s: 6, grow: 0 },
        { label: "Inhale", sub: "Be still.", s: 4, grow: 1 }, { label: "Exhale", sub: "Be.", s: 6, grow: 0 },
        { label: "Silence", sub: "Rest in God", s: 6, grow: null }
      ] },
    "abba": { title: "Abba, Father", note: "Romans 8:15. The Spirit within us cries “Abba, Father.” Breathe in as a child receives; breathe out as one who trusts.",
      phases: [{ label: "Inhale", sub: "Abba…", s: 4, grow: 1 }, { label: "Exhale", sub: "Father.", s: 6, grow: 0 }] },
    "maranatha": { title: "Maranatha", note: "“Come, Lord.” The prayer word taught by John Main for Christian meditation: four equal, unhurried syllables, said silently and faithfully.",
      phases: [{ label: "Inhale", sub: "Ma — ra —", s: 4, grow: 1 }, { label: "Exhale", sub: "— na — tha", s: 6, grow: 0 }] }
  };
  const PACER_ORDER = ["jesus-prayer", "be-still", "abba", "maranatha"];
  const ROPE_PRAYER = "Lord Jesus Christ, Son of God, have mercy on me";

  /* ---------------- Christian practices (Guide › Scripture) ---------------- */
  const guide = {
    intro: "Scripture speaks to every part of this practice. Below are verses for hard moments, Sovereign's teachings read alongside the Bible, and the Christian disciplines of breath, word and body that the Church has kept for centuries.",
    categories: [
      {
        name: "Prayer of the Heart",
        sub: "The Christian contemplative tradition has its own breath and repetition practices, kept by the Desert Fathers and the Eastern Church.",
        items: [
          { id: "jesus-prayer", title: "The Jesus Prayer", tracks: ["men", "women"], time: "5–20 min",
            why: "The tax collector's prayer, “God be merciful to me a sinner,” became the Jesus Prayer, the heart of the hesychast tradition. Joined to the breath and repeated without hurry, it answers Paul's call to “pray without ceasing.” It quiets the mind and gives a surge of desire somewhere holy to go.",
            steps: ["Sit upright and still. Let the breath settle and slow.",
              "Breathing in, pray silently: “Lord Jesus Christ, Son of God,”",
              "Breathing out: “have mercy on me.”",
              "When the mind wanders, return to the words without judging yourself. The returning is the prayer.",
              "In time, let the words sink from the lips to the mind, and from the mind to the heart."],
            cue: "Your daily sitting prayer, or the moment an urge or anxious thought rises.",
            refs: ["Luke 18:13", "1 Thessalonians 5:17"], source: "The Philokalia; The Way of a Pilgrim",
            tool: { type: "breath", pattern: "jesus-prayer" } },
          { id: "prayer-rope", title: "The Prayer Rope: 100 Prayers", tracks: ["men", "women"], time: "10–15 min",
            why: "Orthodox Christians pray the Jesus Prayer on a knotted rope (chotki), one knot for each prayer. Counting frees the mind from keeping track and lets the prayer deepen. Sovereign's counter keeps the knots for you.",
            steps: ["Choose your prayer: the Jesus Prayer, or a short line of Scripture.",
              "Tap once for each prayer, aloud at first, then whispered, then silent.",
              "A soft bell marks every 25.",
              "When you reach 100, sit for a moment in the stillness that remains."],
            cue: "Morning and evening, or whenever you need to steady the heart.",
            refs: ["1 Thessalonians 5:17"], tool: { type: "rope", mantra: "Lord Jesus Christ, Son of God, have mercy on me" } },
          { id: "be-still-prayer", title: "Be Still: A Breath Prayer", tracks: ["men", "women"], time: "3–5 min",
            why: "A breath prayer made from Psalm 46:10. Each round lets go of one more word, until all that remains is “Be.” It is a short, simple way into silence before God.",
            steps: ["Breathe in: “Be still, and know.” Breathe out: “that I am God.”",
              "Then: “Be still, and know / that I am.”",
              "Then: “Be still, / and know.”",
              "Then: “Be still. / Be.”",
              "Rest in the silence, then begin again."],
            cue: "Before work, before a hard conversation, or whenever the day speeds up.",
            refs: ["Psalm 46:10"], tool: { type: "breath", pattern: "be-still" } },
          { id: "abba-prayer", title: "Abba, Father", tracks: ["men", "women"], time: "3–5 min",
            why: "Abba is the intimate word Jesus used for his Father, and Paul says the Spirit puts it in our mouths. Two words on two breaths are enough to remember whose child you are.",
            steps: ["Breathe in slowly: “Abba…”", "Breathe out: “Father.”", "Let your shoulders drop and your belly soften as you breathe out.", "Continue for twenty breaths or more."],
            cue: "When insecurity, loneliness or shame rise.", refs: ["Romans 8:15"], tool: { type: "breath", pattern: "abba" } },
          { id: "christian-meditation", title: "Christian Meditation (Maranatha)", tracks: ["men", "women"], time: "20 min",
            why: "The Benedictine monk John Main taught a simple discipline drawn from the early desert monks: sit still and say one prayer word, “Maranatha” (“Come, Lord”), faithfully for twenty minutes, morning and evening. It is the Christian path into the stillness Sovereign's meditation describes.",
            steps: ["Sit still, back upright, eyes lightly closed.",
              "Silently begin to say the word: Ma-ra-na-tha, four equal syllables.",
              "Listen to the word as you say it. Let thoughts and images pass.",
              "When you notice you've drifted, gently return to the word.",
              "Continue for 20 minutes, morning and evening."],
            cue: "Your daily meditation, in place of a mantra.", source: "John Main, Word into Silence",
            tool: { type: "breath", pattern: "maranatha" } }
        ]
      },
      {
        name: "The Word",
        sub: "Let Scripture shape the mind that shapes the energy.",
        items: [
          { id: "lectio-divina", title: "Lectio Divina", tracks: ["men", "women"], time: "15–20 min",
            why: "“Divine reading”: an ancient monastic way of praying with Scripture. Instead of reading for information, you read slowly until one word or phrase stops you, and let it become prayer. It renews the mind from the inside.",
            steps: ["Read (lectio): read a short passage slowly, twice. Notice the word or phrase that catches you.",
              "Reflect (meditatio): repeat that phrase. Why this, today?",
              "Respond (oratio): speak to God honestly about what stirred in you.",
              "Rest (contemplatio): sit quietly in God's presence without words.",
              "Carry the phrase with you through the day."],
            cue: "Morning, before the phone. Try the verses in “Sovereign's teachings” above.",
            refs: ["Psalm 119:105", "Joshua 1:8"], link: { view: "journal", label: "Write in your journal" } },
          { id: "carry-a-verse", title: "Carry One Verse", tracks: ["men", "women"], time: "All day",
            why: "When he was tempted in the wilderness, Jesus answered each temptation with Scripture (Matthew 4). A single verse learned by heart is a ready answer when an urge or dark thought arrives.",
            steps: ["Choose one verse each morning. The verse of the day on Home is a good start.",
              "Write it down or say it aloud three times.",
              "When temptation, worry or anger comes, say the verse slowly, then take three deep breaths.",
              "At night, see whether you can still recall it."],
            cue: "Every day, especially in a hard season.", refs: ["1 Corinthians 10:13"] },
          { id: "examen", title: "The Evening Examen", tracks: ["men", "women"], time: "10 min",
            why: "St Ignatius asked his companions never to skip this short evening prayer. It reviews the day in God's presence: where you felt alive and close to him, and where you drifted. It is honest without being harsh, the Christian form of Sovereign's evening reflection.",
            steps: ["Become aware of God's presence. Ask for light to see the day truly.",
              "Give thanks for three specific gifts from today.",
              "Review the day hour by hour. Where did you feel consolation, and where desolation?",
              "Name one failing honestly and ask forgiveness.",
              "Look toward tomorrow: ask for the grace you will need."],
            cue: "Before sleep. Pairs well with the journal.",
            refs: ["Psalm 139:23-24", "Lamentations 3:40"], source: "St Ignatius of Loyola, Spiritual Exercises",
            link: { view: "journal", label: "Write in your journal" } }
        ]
      },
      {
        name: "Discipline of the Body",
        sub: "Honour God with the body: fasting, watching and walking in creation.",
        items: [
          { id: "flee-and-fill", title: "Flee, Then Fill", tracks: ["men", "women"], time: "2–5 min",
            why: "Paul's counsel to Timothy has two halves: flee youthful lusts, and follow righteousness. Running from a temptation leaves an empty space. Filling it straight away with prayer, movement and good company keeps the urge from coming back.",
            steps: ["Flee: physically leave the room, put the phone down, step outside.",
              "Breathe: three slow breaths of the Jesus Prayer.",
              "Move: twenty squats, a brisk walk or push-ups to spend the charge.",
              "Fill: turn to something good, like a task, a call to a friend or Scripture.",
              "If you're struggling often, tell a trusted brother or sister."],
            cue: "The moment an urge arrives.", refs: ["2 Timothy 2:22", "Galatians 5:16"] },
          { id: "christian-fasting", title: "Fasting", tracks: ["men", "women"], time: "From one meal to a day",
            why: "Fasting is one of the oldest Christian disciplines. Jesus assumed his followers would fast, quietly and without show. Going without food for a time loosens the grip of appetite in general and turns hunger into prayer.",
            steps: ["Start small: skip one meal and spend that time in prayer.",
              "Drink water throughout. Break the fast gently.",
              "When hunger comes, let it remind you to pray.",
              "Keep it between you and God. Don't announce it."],
            cue: "Weekly (many Christians fast on Wednesday or Friday), or before an important decision.",
            caution: "Don't fast if you're pregnant, nursing, diabetic, underweight, have a history of disordered eating or take medication that needs food. Ask your doctor first if unsure.",
            refs: ["Matthew 6:17-18"] },
          { id: "night-watch", title: "Keeping the Night Watch", tracks: ["men", "women"], time: "15–30 min",
            why: "Monks have risen in the night to pray since the early Church, and Jesus rose “a great while before day.” The quiet hours before dawn, when the house is silent and the phone is still, are a natural time to meet God.",
            steps: ["Only on a night when you've slept well first. Set a gentle alarm, or simply pray if you wake naturally.",
              "Don't turn on bright lights or the phone. Sit up, wrapped warm.",
              "Pray a psalm slowly, then the Jesus Prayer for ten minutes.",
              "Lie down again with a word of thanks."],
            cue: "Once a week at most, when life allows.",
            caution: "Sleep is part of the foundation. Don't break your sleep regularly, and skip this if you have trouble sleeping.",
            refs: ["Psalm 119:148", "Mark 1:35"] },
          { id: "creation-walk", title: "Walk in Creation", tracks: ["men", "women"], time: "15–30 min",
            why: "Sovereign's grounding takes you outside and onto the earth. For a Christian it is also a way to worship: “The heavens declare the glory of God.” Walk slowly, notice what God has made, and give thanks.",
            steps: ["Go outside without headphones. If you can, stand barefoot on grass, soil or sand for a few minutes.",
              "Walk slowly. Name five things you see and thank God for each.",
              "Pray for one person on each street or path you pass.",
              "End by standing still and breathing in the open air."],
            cue: "Daily, ideally in morning light.", refs: ["Psalm 19:1", "Psalm 24:1"], link: { view: "home", label: "Log grounding on Home" } }
        ]
      }
    ]
  };

  const BOOKS = {
    name: "Christian Spirituality & Discipline",
    items: [
      { title: "The Holy Bible", author: "King James Version · World English Bible", note: "Both included in Sovereign in full for the verses used here, and free to read anywhere. Start with the Psalms, the Gospel of John and Paul's letter to the Romans." },
      { title: "The Way of a Pilgrim", author: "Anonymous (19th-century Russia)", note: "A wanderer's search to learn how to “pray without ceasing,” and his discovery of the Jesus Prayer joined to the breath. Short, warm and practical." },
      { title: "The Philokalia", author: "Compiled by St Nikodimos and St Makarios", note: "The great collection of Eastern Christian writings on watchfulness, stillness and the prayer of the heart. Read slowly, a few pages at a time." },
      { title: "Celebration of Discipline", author: "Richard J. Foster", note: "The modern classic on the spiritual disciplines: meditation, prayer, fasting, study, simplicity, solitude and more. The best single companion to this practice." },
      { title: "The Practice of the Presence of God", author: "Brother Lawrence", note: "A 17th-century kitchen monk on living every ordinary moment in conversation with God. Very short and very freeing." },
      { title: "Word into Silence", author: "John Main", note: "The Benedictine teaching on Christian meditation with a prayer word. The Christian path into the stillness Sovereign's meditation describes." },
      { title: "The Cloud of Unknowing", author: "Anonymous (14th-century England)", note: "A mystical guide to contemplative prayer: reaching toward God in love beyond thoughts and images." },
      { title: "Confessions", author: "St Augustine of Hippo", note: "The original honest account of the struggle with desire and the long road to freedom: “Our heart is restless until it rests in you.”" },
      { title: "Man and Woman He Created Them: A Theology of the Body", author: "Pope St John Paul II", note: "A deep, positive Christian vision of the body, sexuality and self-mastery as the freedom to give yourself in love." },
      { title: "Spiritual Disciplines for the Christian Life", author: "Donald S. Whitney", note: "A practical, Protestant guide to Bible intake, prayer, fasting, silence and journaling, with simple ways to begin." }
    ]
  };

  /* ---------------- Verse of the day (Home) ---------------- */
  const DAILY = ["Psalm 46:10", "Galatians 5:22-23", "Romans 12:2", "Proverbs 4:23", "Isaiah 40:31", "1 Corinthians 6:18-20",
    "Philippians 4:8", "Psalm 51:10", "Matthew 5:14-16", "2 Timothy 1:7", "Isaiah 41:10", "Lamentations 3:22-23", "Colossians 3:23",
    "Matthew 11:28-30", "1 Corinthians 10:13", "Psalm 19:14", "Isaiah 26:3", "Romans 12:1", "Philippians 4:6-7", "Proverbs 25:28",
    "Genesis 2:7", "Psalm 1:2", "Ephesians 2:10", "1 Corinthians 9:25", "Psalm 147:3", "2 Corinthians 3:18", "Proverbs 24:16",
    "Romans 15:13", "Psalm 139:23-24", "Mark 1:35", "1 Kings 19:12"];

  /* ---------------- Journal prompts (Blended & Christian) ---------------- */
  const PROMPTS = [
    "Where did you sense God's presence today? Where did it feel absent?",
    "What did you give thanks for today, and what did you forget to?",
    "Which desire pulled hardest today? What was it really asking for?",
    "Which verse stayed with you today, and why?",
    "Where did you choose self-control today? What made it possible?",
    "What do you need to lay down at the foot of the cross tonight?",
    "Who could you serve with the energy you're building?",
    "When did you feel most free today?",
    "What would it look like to honour God with your body tomorrow?",
    "Where did you fall short today? Write it honestly, then write the mercy."
  ];

  /* Christian path: practices from other traditions are set aside and,
     where the app would suggest one, a Christian practice takes its place. */
  const HIDE = {
    guide: ["so-hum", "aum", "bija-ascent", "six-healing-sounds", "japa-mala", "pratyahara", "microcosmic-orbit", "mudras-root",
      "breast-massage", "golden-egg", "salt-cleanse", "cord-cutting", "space-clearing", "hand-overview"],
    guideCats: ["The Planetary Hand"],
    protocols: ["akashic-window", "serpent-rising", "yoni-breathing"],
    lessons: ["akashic-window", "esoteric-principles", "planetary-hand"],
    pacer: ["so-hum", "aum", "bija", "healing-sounds"],
    bookCats: ["Sexual Energy & Taoist Cultivation", "The Aura & the Energy Body", "Breath, Sound & Mantra", "Mind, Reality & the Hermetic Path", "Herbs & Ayurveda"]
  };
  const SWAP = { "so-hum": "be-still", "aum": "jesus-prayer", "bija": "jesus-prayer", "healing-sounds": "abba" };

  return { VERSES, TRANSLATIONS, SHORT, STRUGGLES, STRUGGLES_CREDIT, TEACHINGS, PACER, PACER_ORDER, ROPE_PRAYER, guide, BOOKS, DAILY, PROMPTS, HIDE, SWAP };
})();
