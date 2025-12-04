export const foodData = {
    "Chicken Breast": { calories: 165, unit: "100g" },
    "Rice (White, Cooked)": { calories: 130, unit: "100g" },
    "Rice (Brown, Cooked)": { calories: 111, unit: "100g" },
    "Egg (Large)": { calories: 78, unit: "1 unit" },
    "Banana": { calories: 89, unit: "1 unit" },
    "Apple": { calories: 52, unit: "1 unit" },
    "Oats (Rolled, Dry)": { calories: 389, unit: "100g" },
    "Milk (Whole)": { calories: 61, unit: "100ml" },
    "Milk (Skim)": { calories: 34, unit: "100ml" },
    "Peanut Butter": { calories: 588, unit: "100g" },
    "Bread (Whole Wheat)": { calories: 247, unit: "100g" },
    "Potato (Boiled)": { calories: 87, unit: "100g" },
    "Sweet Potato (Boiled)": { calories: 86, unit: "100g" },
    "Salmon": { calories: 208, unit: "100g" },
    "Beef (Ground, 85%)": { calories: 250, unit: "100g" },
    "Broccoli": { calories: 34, unit: "100g" },
    "Protein Powder (Whey)": { calories: 120, unit: "1 scoop (30g)" },
    "Yogurt (Greek, Plain)": { calories: 59, unit: "100g" },
    "Almonds": { calories: 579, unit: "100g" },
    "Avocado": { calories: 160, unit: "100g" }
};

export const calculateCalories = (foodName, quantity, unit) => {
    const food = foodData[foodName];
    if (!food) return 0;

    // Simple normalization: if unit matches, just multiply.
    // If unit is 100g/100ml, quantity is treated as grams/ml.
    // If unit is "1 unit", quantity is count.

    if (food.unit.includes("100")) {
        return Math.round((food.calories / 100) * quantity);
    } else {
        return Math.round(food.calories * quantity);
    }
};
