const query = () => {
  const defaultSelector = (item) => item;
  const defaultData = [];

  let selector = null;
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
      throw new Error("Invalid type of 'from' argument");
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

  const execute = () => {
    const finalSelector = selector ?? defaultSelector;
    const finalData = data ?? defaultData;

    const filteredData = filters.reduce(
      (data, filter) => data.filter((item) => filter(item)),
      finalData
    );

    const selectedData = filteredData.map((item) => finalSelector(item));

    return selectedData;
  };

  const queryEngine = {
    select,
    from,
    where,
    orderBy: () => {},
    groupBy: () => {},
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

const result6 = query()
  .select(profession)
  .from(persons)
  .where(isTeacher)
  .execute();
console.log(_.isEqual(result6, ["teacher", "teacher", "teacher"]));
