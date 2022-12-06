const query = () => {
  const defaultSelector = (item) => item;
  const defaultData = [];

  let selector = null;
  let groupingSelectors = null;
  let data = null;
  let filters = [];
  let havingFilters = [];
  let comparator = null;

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

  const from = (...tables) => {
    if (data) {
      throw new Error("Duplicate FROM");
    }

    if (tables.length === 1) {
      data = tables[0];

      return queryEngine;
    }

    const joined = [];

    for (let item1 of tables[0]) {
      for (let item2 of tables[1]) {
        joined.push([item1, item2]);
      }
    }

    data = joined;

    return queryEngine;
  };

  const where = (...providedFilters) => {
    filters.push(providedFilters);

    return queryEngine;
  };

  const groupBy = (...selectors) => {
    if (groupingSelectors) {
      throw new Error("Duplicate GROUPBY");
    }

    groupingSelectors = selectors;

    return queryEngine;
  };

  const having = (...providedFilters) => {
    havingFilters.push(providedFilters);

    return queryEngine;
  };

  const orderBy = (providedComparator) => {
    if (comparator) {
      throw new Error("Duplicate ORDERBY");
    }

    comparator = providedComparator;

    return queryEngine;
  };

  const execute = () => {
    const finalSelector = selector ?? defaultSelector;

    let result = data ?? defaultData;

    result = filters.reduce((data, orSelectors) => {
      return data.filter((item) => orSelectors.some((select) => select(item)));
    }, result);

    if (groupingSelectors) {
      result = _group(result, ...groupingSelectors);

      result = havingFilters.reduce(
        (data, orSelectors) =>
          data.filter((item) => orSelectors.some((select) => select(item))),
        result
      );

      if (comparator) {
        result = result.sort(
          ([key1, value1], [key2, value2]) =>
            comparator(value1, value2) || (key1 < key2 ? -1 : 1)
        );
      }
    } else if (comparator) {
      result = [...result].sort(comparator);
    }

    result = result.map((item) => finalSelector(item));

    return result;
  };

  const _group = (data, selector, ...restSelectors) => {
    if (!selector) {
      return data;
    }

    const grouped = [];

    for (let item of data) {
      const groupingValue = selector(item);
      const group = grouped.find(([key]) => key === groupingValue);

      if (group) {
        group[1].push(item);
      } else {
        grouped.push([groupingValue, [item]]);
      }
    }

    for (let group of grouped) {
      group[1] = _group(group[1], ...restSelectors);
    }

    return grouped;
  };

  const queryEngine = {
    select,
    from,
    where,
    groupBy,
    orderBy,
    having,
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
  _.isEqual(query().select().from(numbers2).groupBy(parity, prime).execute(), [
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

// Order by
var numbers3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function descendentCompare(number1, number2) {
  return number2 - number1;
}

// SELECT * FROM numbers ORDER BY value DESC
const result12 = query()
  .select()
  .from(numbers3)
  .orderBy(descendentCompare)
  .execute();
console.log(_.isEqual(result12, [9, 8, 7, 6, 5, 4, 3, 2, 1]));

// With group by
const ascendingCompare = (n1, n2) => n1 - n2;
const test13 = [
  ["divisible", [1, 4, 6, 8, 9]],
  ["prime", [2, 3, 5, 7]],
];
const result13 = query()
  .select()
  .from(numbers3)
  .groupBy(prime)
  .orderBy(ascendingCompare)
  .execute();
console.log(_.isEqual(result13, test13));

var teachers = [
  {
    teacherId: "1",
    teacherName: "Peter",
  },
  {
    teacherId: "2",
    teacherName: "Anna",
  },
];

const students = [
  {
    studentName: "Michael",
    tutor: "1",
  },
  {
    studentName: "Rose",
    tutor: "2",
  },
];

function teacherJoin(join) {
  return join[0].teacherId === join[1].tutor;
}

function student(join) {
  return { studentName: join[1].studentName, teacherName: join[0].teacherName };
}

// SELECT studentName, teacherName FROM teachers, students WHERE teachers.teacherId = students.tutor
const result15 = query()
  .select(student)
  .from(teachers, students)
  .where(teacherJoin)
  .execute();
const test15 = [
  { studentName: "Michael", teacherName: "Peter" },
  { studentName: "Rose", teacherName: "Anna" },
];
console.log(_.isEqual(result15, test15));

var numbers5 = [1, 2, 3, 4, 5, 7];

function lessThan3(number) {
  return number < 3;
}

function greaterThan4(number) {
  return number > 4;
}

// SELECT * FROM number WHERE number < 3 OR number > 4
const result14 = query()
  .select()
  .from(numbers5)
  .where(lessThan3, greaterThan4)
  .execute(); // [1, 2, 5, 7] <- OR filter
console.log(_.isEqual(result14, [1, 2, 5, 7]));

// Having

var nums = [1, 2, 1, 3, 5, 6, 1, 2, 5, 6];

function greatThan1(group) {
  return group[1].length > 1;
}

function isPair(group) {
  return group[0] % 2 === 0;
}

function id(value) {
  return value;
}

function frequency(group) {
  return { value: group[0], frequency: group[1].length };
}

// SELECT number, count(number) FROM numbers GROUP BY number HAVING count(number) > 1 AND isPair(number)
const result16 = query()
  .select(frequency)
  .from(nums)
  .groupBy(id)
  .having(greatThan1)
  .having(isPair)
  .execute();
const test16 = [
  { value: 2, frequency: 2 },
  { value: 6, frequency: 2 },
];
console.log(_.isEqual(result16, test16));

const deepEqual = (...args) => console.log(_.isEqual(...args));

(() => {
  function isEven(number) {
    return number % 2 === 0;
  }

  function parity(number) {
    return isEven(number) ? "even" : "odd";
  }

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

  var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  //SELECT * FROM numbers
  deepEqual(query().select().from(numbers).execute(), numbers);

  //SELECT * FROM numbers GROUP BY parity
  deepEqual(query().select().from(numbers).groupBy(parity).execute(), [
    ["odd", [1, 3, 5, 7, 9]],
    ["even", [2, 4, 6, 8]],
  ]);

  //SELECT * FROM numbers GROUP BY parity, isPrime
  deepEqual(query().select().from(numbers).groupBy(parity, prime).execute(), [
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
  ]);

  function odd(group) {
    return group[0] === "odd";
  }

  //SELECT * FROM numbers GROUP BY parity HAVING
  deepEqual(
    query().select().from(numbers).groupBy(parity).having(odd).execute(),
    [["odd", [1, 3, 5, 7, 9]]]
  );

  function descendentCompare(number1, number2) {
    return number2 - number1;
  }

  //SELECT * FROM numbers ORDER BY value DESC
  deepEqual(
    query().select().from(numbers).orderBy(descendentCompare).execute(),
    [9, 8, 7, 6, 5, 4, 3, 2, 1]
  );

  function lessThan3(number) {
    return number < 3;
  }

  function greaterThan4(number) {
    return number > 4;
  }

  //SELECT * FROM number WHERE number < 3 OR number > 4
  deepEqual(
    query().select().from(numbers).where(lessThan3, greaterThan4).execute(),
    [1, 2, 5, 6, 7, 8, 9]
  );
})();

(function () {
  var persons = [
    { name: "Peter", profession: "teacher", age: 20, maritalStatus: "married" },
    {
      name: "Michael",
      profession: "teacher",
      age: 50,
      maritalStatus: "single",
    },
    { name: "Peter", profession: "teacher", age: 20, maritalStatus: "married" },
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
    {
      name: "Anna",
      profession: "politician",
      age: 50,
      maritalStatus: "married",
    },
  ];

  function profession(person) {
    return person.profession;
  }

  //SELECT * FROM persons GROUPBY profession <- Bad in SQL but possible in JavaScript
  deepEqual(query().select().from(persons).groupBy(profession).execute(), [
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
  ]);

  function isTeacher(person) {
    return person.profession === "teacher";
  }

  //SELECT * FROM persons WHERE profession='teacher' GROUPBY profession
  deepEqual(
    query()
      .select()
      .from(persons)
      .where(isTeacher)
      .groupBy(profession)
      .execute(),
    [
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
    ]
  );

  function professionGroup(group) {
    return group[0];
  }

  //SELECT profession FROM persons GROUPBY profession
  deepEqual(
    query().select(professionGroup).from(persons).groupBy(profession).execute(),
    ["teacher", "scientific", "politician"]
  );

  function name(person) {
    return person.name;
  }

  //SELECT * FROM persons WHERE profession='teacher' GROUPBY profession, name
  deepEqual(
    query().select().from(persons).groupBy(profession, name).execute(),
    [
      [
        "teacher",
        [
          [
            "Peter",
            [
              {
                name: "Peter",
                profession: "teacher",
                age: 20,
                maritalStatus: "married",
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
            "Michael",
            [
              {
                name: "Michael",
                profession: "teacher",
                age: 50,
                maritalStatus: "single",
              },
            ],
          ],
        ],
      ],
      [
        "scientific",
        [
          [
            "Anna",
            [
              {
                name: "Anna",
                profession: "scientific",
                age: 20,
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
            "Rose",
            [
              {
                name: "Rose",
                profession: "scientific",
                age: 50,
                maritalStatus: "married",
              },
            ],
          ],
        ],
      ],
      [
        "politician",
        [
          [
            "Anna",
            [
              {
                name: "Anna",
                profession: "politician",
                age: 50,
                maritalStatus: "married",
              },
            ],
          ],
        ],
      ],
    ]
  );

  function age(person) {
    return person.age;
  }

  function maritalStatus(person) {
    return person.maritalStatus;
  }

  //SELECT * FROM persons WHERE profession='teacher' GROUPBY profession, name, age
  deepEqual(
    query()
      .select()
      .from(persons)
      .groupBy(profession, name, age, maritalStatus)
      .execute(),
    [
      [
        "teacher",
        [
          [
            "Peter",
            [
              [
                20,
                [
                  [
                    "married",
                    [
                      {
                        name: "Peter",
                        profession: "teacher",
                        age: 20,
                        maritalStatus: "married",
                      },
                      {
                        name: "Peter",
                        profession: "teacher",
                        age: 20,
                        maritalStatus: "married",
                      },
                    ],
                  ],
                ],
              ],
            ],
          ],
          [
            "Michael",
            [
              [
                50,
                [
                  [
                    "single",
                    [
                      {
                        name: "Michael",
                        profession: "teacher",
                        age: 50,
                        maritalStatus: "single",
                      },
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
      [
        "scientific",
        [
          [
            "Anna",
            [
              [
                20,
                [
                  [
                    "married",
                    [
                      {
                        name: "Anna",
                        profession: "scientific",
                        age: 20,
                        maritalStatus: "married",
                      },
                    ],
                  ],
                  [
                    "single",
                    [
                      {
                        name: "Anna",
                        profession: "scientific",
                        age: 20,
                        maritalStatus: "single",
                      },
                    ],
                  ],
                ],
              ],
            ],
          ],
          [
            "Rose",
            [
              [
                50,
                [
                  [
                    "married",
                    [
                      {
                        name: "Rose",
                        profession: "scientific",
                        age: 50,
                        maritalStatus: "married",
                      },
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
      [
        "politician",
        [
          [
            "Anna",
            [
              [
                50,
                [
                  [
                    "married",
                    [
                      {
                        name: "Anna",
                        profession: "politician",
                        age: 50,
                        maritalStatus: "married",
                      },
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
    ]
  );

  function professionCount(group) {
    return [group[0], group[1].length];
  }

  //SELECT profession, count(profession) FROM persons GROUPBY profession
  deepEqual(
    query().select(professionCount).from(persons).groupBy(profession).execute(),
    [
      ["teacher", 3],
      ["scientific", 3],
      ["politician", 1],
    ]
  );

  function naturalCompare(value1, value2) {
    if (value1 < value2) {
      return -1;
    } else if (value1 > value2) {
      return 1;
    } else {
      return 0;
    }
  }

  //SELECT profession, count(profession) FROM persons GROUPBY profession ORDER BY profession
  const r1 = query()
    .select(professionCount)
    .from(persons)
    .groupBy(profession)
    .orderBy(naturalCompare)
    .execute();
  deepEqual(r1, [
    ["politician", 1],
    ["scientific", 3],
    ["teacher", 3],
  ]);
})();

(function () {
  var persons = [
    ["Peter", 3],
    ["Anna", 4],
    ["Peter", 7],
    ["Michael", 10],
  ];

  function nameGrouping(person) {
    return person[0];
  }

  function sumValues(value) {
    return [
      value[0],
      value[1].reduce(function (result, person) {
        return result + person[1];
      }, 0),
    ];
  }

  function naturalCompare(value1, value2) {
    if (value1 < value2) {
      return -1;
    } else if (value1 > value2) {
      return 1;
    } else {
      return 0;
    }
  }
  //SELECT name, sum(value) FROM persons ORDER BY naturalCompare GROUP BY nameGrouping
  deepEqual(
    query()
      .select(sumValues)
      .from(persons)
      .orderBy(naturalCompare)
      .groupBy(nameGrouping)
      .execute(),
    [
      ["Anna", 4],
      ["Michael", 10],
      ["Peter", 10],
    ]
  );

  var numbers = [1, 2, 1, 3, 5, 6, 1, 2, 5, 6];

  function id(value) {
    return value;
  }

  function frequency(group) {
    return { value: group[0], frequency: group[1].length };
  }

  //SELECT number, count(number) FROM numbers GROUP BY number
  deepEqual(query().select(frequency).from(numbers).groupBy(id).execute(), [
    { value: 1, frequency: 3 },
    { value: 2, frequency: 2 },
    { value: 3, frequency: 1 },
    { value: 5, frequency: 2 },
    { value: 6, frequency: 2 },
  ]);

  function greatThan1(group) {
    return group[1].length > 1;
  }

  function isPair(group) {
    return group[0] % 2 === 0;
  }

  //SELECT number, count(number) FROM numbers GROUP BY number HAVING count(number) > 1 AND isPair(number)
  deepEqual(
    query()
      .select(frequency)
      .from(numbers)
      .groupBy(id)
      .having(greatThan1)
      .having(isPair)
      .execute(),
    [
      { value: 2, frequency: 2 },
      { value: 6, frequency: 2 },
    ]
  );
})();

(function () {
  var teachers = [
    {
      teacherId: "1",
      teacherName: "Peter",
    },
    {
      teacherId: "2",
      teacherName: "Anna",
    },
  ];

  var students = [
    {
      studentName: "Michael",
      tutor: "1",
    },
    {
      studentName: "Rose",
      tutor: "2",
    },
  ];

  function teacherJoin(join) {
    return join[0].teacherId === join[1].tutor;
  }

  function student(join) {
    return {
      studentName: join[1].studentName,
      teacherName: join[0].teacherName,
    };
  }

  //SELECT studentName, teacherName FROM teachers, students WHERE teachers.teacherId = students.tutor
  deepEqual(
    query()
      .select(student)
      .from(teachers, students)
      .where(teacherJoin)
      .execute(),
    [
      { studentName: "Michael", teacherName: "Peter" },
      { studentName: "Rose", teacherName: "Anna" },
    ]
  );

  var numbers1 = [1, 2];
  var numbers2 = [4, 5];

  const r2 = query().select().from(numbers1, numbers2).execute();
  console.log(r2);
  deepEqual(r2, [
    [1, 4],
    [1, 5],
    [2, 4],
    [2, 5],
  ]);

  function tutor1(join) {
    return join[1].tutor === "1";
  }

  //SELECT studentName, teacherName FROM teachers, students WHERE teachers.teacherId = students.tutor AND tutor = 1
  deepEqual(
    query()
      .select(student)
      .from(teachers, students)
      .where(teacherJoin)
      .where(tutor1)
      .execute(),
    [{ studentName: "Michael", teacherName: "Peter" }]
  );
})();
