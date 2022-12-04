const query = () => {
  const defaultSelector = (item) => item;
  const defaultData = [];

  let selector = null;
  let groupingSelector = null;
  let data = null;
  let filters = [];

  const select = (currentSelector) => {
    if (
      typeof currentSelector !== "undefined" &&
      typeof currentSelector !== "function"
    ) {
      throw new Error("Invalid type of selector");
    }

    if (selector) {
      throw new Error("Duplicate SELECT");
    }

    selector = currentSelector ?? defaultSelector;

    return queryEngine;
  };

  const from = (currentData) => {
    if (currentData === undefined && currentData.length === undefined) {
      throw new Error("Invalid type of FROM argument");
    }

    if (data) {
      throw new Error("Duplicate FROM");
    }

    data = currentData ?? defaultData;

    return queryEngine;
  };

  const where = (filter) => {
    if (!filter || typeof filter !== "function") {
      return queryEngine;
    }

    filters.push(filter);

    return queryEngine;
  };

  const groupBy = (selector) => {
    if (!selector || typeof selector !== "function") {
      throw new Error("Invalid grouping selector argument");
    }

    groupingSelector = selector;

    return queryEngine;
  };

  const execute = () => {
    const finalSelector = selector ?? defaultSelector;

    let result = data ?? defaultData;

    result = filters.reduce(
      (data, filter) => data.filter((item) => filter(item)),
      result
    );

    if (groupingSelector) {
      const grouped = [];

      for (let item of result) {
        const groupingValue = groupingSelector(item);
        const group = grouped.find(([key]) => key === groupingValue);

        if (group) {
          group[1].push(item);
        } else {
          grouped.push([groupingValue, [item]]);
        }
      }

      result = grouped;
    }

    result = result.map((item) => finalSelector(item));

    return result;
  };

  const queryEngine = {
    select,
    from,
    where,
    groupBy,
    orderBy: () => {},
    having: () => {},
    execute,
  };

  return queryEngine;
};

const numbers = [1, 2, 3];

// Only execute query
const result1 = query().execute();
console.log(_.isEqual(result1, []));

// SELECT * FROM numbers
const result2 = query().select().from(numbers).execute();
console.log(_.isEqual(result2, [1, 2, 3]));

// Order of SELECT and FROM doesn't matter
const result3 = query().from(numbers).select().execute();
console.log(_.isEqual(result3, [1, 2, 3]));

const persons = [
  { name: "Peter", profession: "teacher", age: 20, maritalStatus: "married" },
  { name: "Michael", profession: "teacher", age: 50, maritalStatus: "single" },
  { name: "Peter", profession: "teacher", age: 20, maritalStatus: "married" },
  { name: "Anna", profession: "scientific", age: 20, maritalStatus: "married" },
  { name: "Rose", profession: "scientific", age: 50, maritalStatus: "married" },
  { name: "Anna", profession: "scientific", age: 20, maritalStatus: "single" },
  { name: "Anna", profession: "politician", age: 50, maritalStatus: "married" },
];

// SELECT * FROM persons
const result4 = query().from(persons).execute();
console.log(_.isEqual(result4, persons));

// SELECT profession FROM persons
const profession = (person) => person.profession;

// SELECT profession FROM persons
const result5 = query().from(persons).select(profession).execute();
console.log(
  _.isEqual(result5, [
    "teacher",
    "teacher",
    "teacher",
    "scientific",
    "scientific",
    "scientific",
    "politician",
  ])
);

// If you repeat SELECT or FROM an error occurs

// Duplicate select
try {
  query().select().select().execute();
} catch (error) {
  console.log(error.message === "Duplicate SELECT");
}

// Duplicate select
try {
  query().select().from([]).select().execute();
} catch (error) {
  console.log(error.message === "Duplicate SELECT");
}

// Duplicate from
try {
  query().select().from([]).from([]).execute();
} catch (error) {
  console.log(error.message === "Duplicate FROM");
}

// You can omit any SQL clause
console.log(_.isEqual(query().select().execute(), []));
console.log(_.isEqual(query().from(numbers).execute(), [1, 2, 3]));
console.log(_.isEqual(query().execute(), []));

// Filters
function isTeacher(person) {
  return person.profession === "teacher";
}

// SELECT profession FROM persons WHERE profession="teacher"
const result6 = query()
  .select(profession)
  .from(persons)
  .where(isTeacher)
  .execute();
console.log(_.isEqual(result6, ["teacher", "teacher", "teacher"]));

// SELECT * FROM persons WHERE profession="teacher"
const result7 = query().select().from(persons).where(isTeacher).execute();
const test7 = persons.filter((person) => person.profession === "teacher");
console.log(_.isEqual(result7, test7));

// SELECT name FROM persons WHERE profession="teacher"
const nameSelector = (person) => person.name;
const result8 = query()
  .select(nameSelector)
  .from(persons)
  .where(isTeacher)
  .execute();
console.log(_.isEqual(result8, ["Peter", "Michael", "Peter"]));

// Group by
const result9 = query().select().from(persons).groupBy(profession).execute();
const test9 = [
  [
    "teacher",
    [
      {
        name: "Peter",
        profession: "teacher",
        age: 20,
        maritalStatus: "married",
      },
      {
        name: "Michael",
        profession: "teacher",
        age: 50,
        maritalStatus: "single",
      },
      {
        name: "Peter",
        profession: "teacher",
        age: 20,
        maritalStatus: "married",
      },
    ],
  ],
  [
    "scientific",
    [
      {
        name: "Anna",
        profession: "scientific",
        age: 20,
        maritalStatus: "married",
      },
      {
        name: "Rose",
        profession: "scientific",
        age: 50,
        maritalStatus: "married",
      },
      {
        name: "Anna",
        profession: "scientific",
        age: 20,
        maritalStatus: "single",
      },
    ],
  ],
  [
    "politician",
    [
      {
        name: "Anna",
        profession: "politician",
        age: 50,
        maritalStatus: "married",
      },
    ],
  ],
];
console.log(_.isEqual(result9, test9));

// SELECT * FROM persons WHERE profession='teacher' GROUP BY profession
const result10 = query()
  .select()
  .from(persons)
  .where(isTeacher)
  .groupBy(profession)
  .execute();
// console.log(result10);

// SELECT with GROUP BY
const professionGroup = (group) => group[0];
const result11 = query()
  .select(professionGroup)
  .from(persons)
  .groupBy(profession)
  .execute();
console.log(_.isEqual(result11, ["teacher", "scientific", "politician"]));

// Group by example
function isEven(number) {
  return number % 2 === 0;
}

function parity(number) {
  return isEven(number) ? "even" : "odd";
}

const numbers2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// SELECT * FROM numbers
console.log(
  _.isEqual(
    query().select().from(numbers2).execute(),
    [1, 2, 3, 4, 5, 6, 7, 8, 9]
  )
);

// SELECT * FROM numbers GROUP BY parity
console.log(
  _.isEqual(query().select().from(numbers2).groupBy(parity).execute(), [
    ["odd", [1, 3, 5, 7, 9]],
    ["even", [2, 4, 6, 8]],
  ])
);

// Multilevel grouping
function isPrime(number) {
  if (number < 2) {
    return false;
  }
  var divisor = 2;
  for (; number % divisor !== 0; divisor++);
  return divisor === number;
}

function prime(number) {
  return isPrime(number) ? "prime" : "divisible";
}

console.log(
  _.isEqual(query().select().from(numbers).groupBy(parity, prime).execute(), [
    [
      "odd",
      [
        ["divisible", [1, 9]],
        ["prime", [3, 5, 7]],
      ],
    ],
    [
      "even",
      [
        ["prime", [2]],
        ["divisible", [4, 6, 8]],
      ],
    ],
  ])
);
