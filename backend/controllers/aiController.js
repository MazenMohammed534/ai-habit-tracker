import Habit from "../models/Habit.js"
import HabitLog from "../models/HabitLog.js"
import AIInsight from "../models/AIInsight.js"
import { chatCompletion , SYSTEM_PROMPTS } from "../utils/aiService.js"
import { lastNDays } from "../utils/dataHelpers.js"

const buildWeeklyContext = async (userId) => {
    const habits = await Habit.find({ userId, isArchived: false });
    const days = lastNDays(6);
    const logs = await HabitLog.find({
      userId,
      completedDate: { $gte: days[0], $lte: days[days.length - 1] },
    });
  
    const perHabit = habits.map((h) => {
      const completed = logs.filter(
        (l) => String(l.habitId) === String(h._id)
      ).length;
      return {
        name: h.name,
        category: h.category,
        frequency: h.frequency,
        completedDays: completed,
        targetDays: h.targetDays,
      };
    });
  
    return { days, perHabit };
  };

export const weeklyReport = async (req, res) => {
  try {
    const ctx = await buildWeeklyContext(req.user._id);
    if (!ctx.perHabit.length) {
      return res.json({
        content:
          "You don't have any active habits yet. Create your first habit to start tracking — I'll generate a weekly report once you have some data",
      });
    }

    const lastDay = ctx.days[ctx.days.length - 1];
    const habitLines = ctx.perHabit
      .map(
        (h) =>
          `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target ${h.targetDays} days per week`,
      )
      .join("\n");

    const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${lastDay}):

${habitLines}

Please write the personalised weekly report now.`;

    const { ok, content } = await chatCompletion({
      system: SYSTEM_PROMPTS.weekly,
      user: userMsg,
    });

    if (!ok) {
      return res.json({ content });
    }

    await AIInsight.create({
      userId: req.user._id,
      type: "weekly",
      content,
    });

    res.json({ content });
  } catch (err) {
    console.error("weeklyReport error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const suggestHabits = async (req , res) => {
    try {
        const { goals , productiveTime , struggles } = req.body;
        const userMsg = `Here is the user's goals: ${goals} , productive time: ${productiveTime} , struggles: ${struggles}
        Please suggest 3 new or adjusted habits. For each habit provide: a title, a short reason why it fits this user, and a simple first step. Be practical and personalized.`;
        const content = await chatCompletion({
            system: SYSTEM_PROMPTS.suggestion,
            user: userMsg,
        });
        let suggestions = [];
        try {
          const paresed = parseJSON(content.replace(/```json|```/g,"").trim());
          suggestions = paresed.suggestions || [];
        } catch(err){
          console.error("suggestHabits error:", err.message);
          suggestions = [];
        }
        if(!suggestions.length){
          suggestions = [
            {
              name: "5-minute morning stretch",
              description: "Loosen up before the day starts.",
              frequency: "daily",
              category: "Health",
              icon: "🧘",
              reason:
                "Pairs naturally with your existing morning habits and takes almost no willpower.",
            },
            {
              name: "No screens for the first 30 minutes",
              description: "Start the morning offline.",
              frequency: "daily",
              category: "Mindfulness",
              icon: "😴",
              reason:
                "Helps your meditation habit stick and reduces decision fatigue early in the day.",
            },
            {
              name: "Weekly long walk",
              description: "60–90 minutes outdoors on Sunday.",
              frequency: "weekly",
              category: "Fitness",
              icon: "🚶",
              reason:
                "Gives you a low-friction movement habit on weekends when your run consistency drops.",
            },
          ];
        }
        await AIInsight.create({
          userId: req.user._id,
          type: "suggestion",
          content: JSON.stringify(suggestions),
          meta : { goals , productiveTime , struggles },
        });
        res.json({ suggestions , content });
    } catch(err){
      console.error("suggestHabits error:", err.message);
      res.status(500).json({ message: "Internal server error" });
    }
};

export const recoveryPlan = async (req , res) => {
  try {
    const { habitId } = req.body;
    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user._id,
    });

    if(!habit){
      return res.status(404).json({ message: "Habit not found" });
    }

    const logs = await HabitLog.find({
      habitId,
      userId: req.user._id,
    }).sort({ completedDate: -1 });
    const keys = logs.map((l) => l.completedDate);
    const { current, longest } = calcStreak(keys);
    const userMsg = `The user broke a streak for the habit: ${habit.name}. Please write a 3-day recovery plan tailored to their habit and schedule. Be gentle, realistic, and focus on rebuilding momentum — not guilt. Use clear day-by-day structure.`;
    const {content} = await chatCompletion({
      system: SYSTEM_PROMPTS.recovery,
      user: userMsg,
    });
    await AIInsight.create({
      userId: req.user._id,
      type: "recovery",
      content,
      meta: { habitId},
    });
    res.json({ content });
  } catch(err){
    console.error("recoveryPlan error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const chatAnalysis = async (req , res) => { 
  try {
    const { question } = req.body;
    if(!question){
      return res.status(400).json({ message: "Question is required" });
    }
    const habits = await Habit.find({
      userId: req.user._id,
      isArchived: false,
    });

    const days = lastNDays(30);
    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: days[0], $lte: days[days.length - 1] },
    });

    const context = habits.map((h) => {
      const hLogs = logs.filter((l) => String(l.habitId) === String(h._id));
      const byDow = [0,0,0,0,0,0,0];
      for (const l of hLogs){
        const dow = new Date(l.completedDate).getDay();
        byDow[dow]++;
      }
      return `- ${h.name} (${h.category}, ${h.frequency}): completed ${byDow[0]} times on Monday, ${byDow[1]} times on Tuesday, ${byDow[2]} times on Wednesday, ${byDow[3]} times on Thursday, ${byDow[4]} times on Friday, ${byDow[5]} times on Saturday, ${byDow[6]} times on Sunday`;
    }).join("\n");

    const userMsg = `Here is the user's habit data for the past 30 days:

${context}

Please answer the user's question: ${question}`;
    const {content} = await chatCompletion({
      system: SYSTEM_PROMPTS.chat,
      user: userMsg,
    });
    await AIInsight.create({
      userId: req.user._id,
      type: "chat",
      content,
      meta: { question },
    });
    res.json({ content });
  } catch(err){
    console.error("chatAnalysis error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const morningMotivation = async (req , res) => { 
  try { 
    const habits = await Habit.find({
      userId: req.user._id,
      isArchived: false,
    });
    if(!habits.length){
      return res.json({ content: "You don't have any active habits yet. Create your first habit to start tracking — I'll generate a morning motivation once you have some data" });
    }
    const days = lastNDays(30);
    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: days[0], $lte: days[days.length - 1] },
    });

    const ctx = habits.map((h) => {
      const hLogs = logs.filter((l) => String(l.habitId) === String(h._id)).map((l) => l.completedDate).sort().reverse();
      const { current } = calcStreak(hLogs);
      return `- ${h.name} (${h.category}, ${h.frequency}): completed ${current} times in the past 30 days`;
    }).join("\n");

    const today = todayKey();
    const todayLogs = logs.filter((l) => l.completedDate === today);
    const done = todayLogs.length;
    const total = habits.length;

    const userMsg = `Here is the user's habit data for the past 30  days:

${ctx}

Today the user has completed ${done} of ${total} habits. Please write a morning motivation tailored to their habits and schedule. Be positive, inspiring, and personalized.`;
    
    const {content} = await chatCompletion({
      system: SYSTEM_PROMPTS.morning,
      user: userMsg,
    });
    await AIInsight.create({
      userId: req.user._id,
      type: "morning",
      content,
    });
    res.json({ content });
  } catch(err){
    console.error("morningMotivation error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};