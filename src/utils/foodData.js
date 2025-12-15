export const foodData = {
    // Proteins
    "Chicken Breast": { calories: 165, unit: "100g" },
    "Chicken Thigh": { calories: 209, unit: "100g" },
    "Beef (Ground, 85%)": { calories: 250, unit: "100g" },
    "Steak (Sirloin)": { calories: 244, unit: "100g" },
    "Salmon": { calories: 208, unit: "100g" },
    "Tuna (Canned)": { calories: 132, unit: "100g" },
    "Egg (Large)": { calories: 78, unit: "1 unit" },
    "Egg Whites": { calories: 17, unit: "1 unit" },
    "Greek Yogurt (Plain)": { calories: 59, unit: "100g" },
    "Cottage Cheese": { calories: 98, unit: "100g" },
    "Tofu": { calories: 76, unit: "100g" },
    "Protein Powder (Whey)": { calories: 120, unit: "1 scoop (30g)" },

    // Carbs
    "Rice (White, Cooked)": { calories: 130, unit: "100g" },
    "Rice (Brown, Cooked)": { calories: 111, unit: "100g" },
    "Oats (Rolled, Dry)": { calories: 389, unit: "100g" },
    "Quinoa (Cooked)": { calories: 120, unit: "100g" },
    "Potato (Boiled)": { calories: 87, unit: "100g" },
    "Sweet Potato (Boiled)": { calories: 86, unit: "100g" },
    "Pasta (White, Cooked)": { calories: 131, unit: "100g" },
    "Bread (White)": { calories: 265, unit: "100g" },
    "Bread (Whole Wheat)": { calories: 247, unit: "100g" },
    "Tortilla (Flour)": { calories: 147, unit: "1 unit" },

    // Fruits
    "Banana": { calories: 89, unit: "1 unit" },
    "Apple": { calories: 52, unit: "1 unit" },
    "Orange": { calories: 47, unit: "1 unit" },
    "Berries (Mixed)": { calories: 57, unit: "100g" },
    "Grapes": { calories: 67, unit: "100g" },
    "Watermelon": { calories: 30, unit: "100g" },
    "Avocado": { calories: 160, unit: "100g" },

    // Vegetables
    "Broccoli": { calories: 34, unit: "100g" },
    "Carrots": { calories: 41, unit: "100g" },
    "Spinach": { calories: 23, unit: "100g" },
    "Cucumber": { calories: 15, unit: "100g" },
    "Tomato": { calories: 18, unit: "100g" },
    "Bell Pepper": { calories: 31, unit: "100g" },

    // Fats & Nuts
    "Almonds": { calories: 579, unit: "100g" },
    "Walnuts": { calories: 654, unit: "100g" },
    "Peanut Butter": { calories: 588, unit: "100g" },
    "Olive Oil": { calories: 119, unit: "1 tbsp (15ml)" },
    "Butter": { calories: 102, unit: "1 tbsp (14g)" },

    // Drinks
    "Milk (Whole)": { calories: 61, unit: "100ml" },
    "Milk (Skim)": { calories: 34, unit: "100ml" },
    "Almond Milk (Unsweetened)": { calories: 13, unit: "100ml" },
    "Coffee (Black)": { calories: 2, unit: "1 cup" },
    "Orange Juice": { calories: 45, unit: "100ml" },

    // Indian/Common Meals (Estimated)
    "Chicken Biryani": { calories: 290, unit: "100g" },
    "Dosa (Plain)": { calories: 133, unit: "1 unit" },
    "Idli": { calories: 39, unit: "1 unit" },
    "Chapati/Roti": { calories: 104, unit: "1 unit" },
    "Dal (Cooked)": { calories: 110, unit: "100g" },
    "Paneer Butter Masala": { calories: 230, unit: "100g" },

    // Snacks
    "Pizza (Cheese)": { calories: 266, unit: "100g" },
    "Burger (Cheeseburger)": { calories: 303, unit: "1 unit" },
    "Chocolate (Dark)": { calories: 546, unit: "100g" }
};

export const calculateCalories = (foodName, quantity, unit) => {
    if (!foodName) return 0;
    const normalizedInput = foodName.toLowerCase().trim();

    // 1. Try exact match
    let food = foodData[foodName];

    // 2. Try case-insensitive match
    if (!food) {
        const key = Object.keys(foodData).find(k => k.toLowerCase() === normalizedInput);
        if (key) food = foodData[key];
    }

    // 3. Try partial match (e.g. "chicken" -> "Chicken Breast")
    if (!food) {
        const key = Object.keys(foodData).find(k => k.toLowerCase().includes(normalizedInput));
        if (key) food = foodData[key];
    }

    if (!food) return 0;

    // Unit Conversion Logic
    // DB Unit: "100g" or "100ml" -> Base calculation / 100
    // DB Unit: "1 unit" -> Base calculation * quantity

    if (food.unit.includes("100")) {
        // Base is 100g/ml
        if (unit === "1 unit") {
            // Fallback: If user selects "unit" for a "100g" item (like an apple described as 100g), we assume 1 unit ~= 100g if mostly standard, but strictly it's undefined.
            // However, if the DB item is "Apple" (unit: 1 unit), and user selects "unit", it matches below.
            // Here we handle the mismatch.
            return Math.round(food.calories * quantity); // Very rough fallback
        }
        return Math.round((food.calories / 100) * quantity);
    } else {
        // Base is 1 unit or 1 scoop
        if (unit.includes("100")) {
            // User entered grams for a unit-based item.
            // Estimate standard unit weight? (e.g. 1 banana ~= 118g).
            // For now, just linear approx if possible or fail safe.
            return Math.round(food.calories * (quantity / 100)); // Rough guess: 1 unit ~ 100g
        }
        return Math.round(food.calories * quantity);
    }
    return 0;
};
