import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

export const getHabits = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { userId: req.user._id };
    if (includeArchived !== "true") {
      filter.isArchived = false;
    }
    const habits = await Habit.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createHabit = async (req, res) => {
  try {
    const { name, description, category, frequency, targetDays, color, icon } =
      req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const count = await Habit.countDocuments({ userId: req.user._id });
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
      order: count,
    });
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const fields = [
      "name",
      "description",
      "category",
      "frequency",
      "targetDays",
      "color",
      "icon",
      "order",
    ];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        habit[field] = req.body[field];
      }
    }
    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }
    await HabitLog.deleteMany({ habitId: habit._id });
    res.json({ message: "Habit and associated logs deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const archiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }
    habit.isArchived = true;
    await habit.save();
    res.json({ message: "Habit archived" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reorderHabits = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: "orderedIds must be an array" });
    }
    (await Promise.all(
      orderedIds.map((id, index) =>
        Habit.findOneAndUpdate(
          { _id: id, userId: req.user._id },
          { $set: { order: index } },
        ),
      ),
    ),
      res.json({ message: "Habits reordered" }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
