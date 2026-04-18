// S0501 dataset is missing 8 states because they were too small to publish
// So they will be marked as null in the visualizations
const missing_states = new Set([
  "Alaska", "Maine", "Montana", "North Dakota",
  "South Dakota", "Vermont", "West Virginia", "Wyoming"
]);

// Promise is used to load both S0501 and B05006 datasets
Promise.all([
  d3.csv("data/s0501.csv"),
  d3.csv("data/b05006.csv")
 
]).then(function([s0501Raw, b05006Raw]) {

  // Check # rows
  console.log(s0501Raw.length);
  console.log(b05006Raw.length);

  /*
  // S0501 Dataset is labeled for the scope of this project: 
  // Row 1: foreign born pop.
  // Row 45: less than high school education percent
  // Row 46: high school education percent
  // Row 47: some college/assoc. degree percent
  // Row 48: bachelor degree percent
  // Row 49: graduate/professional degree percent
  // Row 71: management/business/science/arts occupation percent 
  // Row 72: service occuptation percent
  // Row 73: sales and office occuptation percent
  // Row 74: natural resources/construction/maintenance percent
  // Row 75: production/transport/material moving percent
  // Row 115: median household income dollars
  // row 119: poverty percent
  */

  // Values containing , (commas) and % (percents) will be change into a number
  function parseValue(str) {
    if (!str || str.trim() === "") return null;
    var cleaned = str.replace(/,/g, "").replace(/%/g, "").trim();
    var num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
 
  // Stores header row from S0501 dataset for column access
  var s0501Header = s0501Raw.columns;
 
  // Builds a mapping from state names to their matching column index
  // The dataset contains an offset
  var s0501ColIndex = {};
  for (var i = 1; i < s0501Header.length; i += 10) {
    var stateName = s0501Header[i].split("!!")[0];
    s0501ColIndex[stateName] = i + 4;
  }
  
  // Get the values from S0501 for a given row and state by 
  // resolving the column index and parsing the dataset value
  function getS0501Value(rowIndex, stateName) {
    var colHeader = s0501Header[s0501ColIndex[stateName]];
    return parseValue(s0501Raw[rowIndex][colHeader]);
  }
  
  // Stores S0501 data by state
  var s0501Data = {};
 
  // Loops through each state in the column index (excluding Puerto Rico)
  // Then builds state level objects
  Object.keys(s0501ColIndex).forEach(function(state) {
    if (state === "Puerto Rico") return;
 
    var missing = missing_states.has(state);
 
    s0501Data[state] = {
      state:              state,
      missingS0501:       missing,
 
      // Foreign Born Pop.
      foreignBornTotal:   missing ? null : getS0501Value(1,   state),
 
      // Education
      edu_lessHS:         missing ? null : getS0501Value(45,  state),
      edu_HS:             missing ? null : getS0501Value(46,  state),
      edu_someCollege:    missing ? null : getS0501Value(47,  state),
      edu_bachelors:      missing ? null : getS0501Value(48,  state),
      edu_graduate:       missing ? null : getS0501Value(49,  state),
 
      // Occupation
      occ_management:     missing ? null : getS0501Value(71,  state),
      occ_service:        missing ? null : getS0501Value(72,  state),
      occ_sales:          missing ? null : getS0501Value(73,  state),
      occ_naturalRes:     missing ? null : getS0501Value(74,  state),
      occ_production:     missing ? null : getS0501Value(75,  state),
 
      // Income / Poverty
      medianIncome:       missing ? null : getS0501Value(115, state),
      povertyRate:        missing ? null : getS0501Value(119, state),
    };
  });
 
  /*
  // B05006 Dataset is labeled for the scope of this project: 
  // Row are origin
  // Columns are states
  // States alphabetical organized
  // Row 2 is Europe
  // Row 47 is Asia
  // Row 95 is Africa
  // Row 130 is Oceania
  // Row 138 is Americas
  */
 
  // Stores header row from B05006 dataset for column access
  var b05006Header = b05006Raw.columns;
 
  // Builds a mapping from state names to their column index by state name
  var b05006ColIndex = {};
  for (var j = 1; j < b05006Header.length; j += 2) {
    var sName = b05006Header[j].split("!!")[0];
    b05006ColIndex[sName] = j;
  }
  
  // Get the values from B05006 for a given row and state by 
  // resolving the column index and parsing the dataset value
  function getB05006Value(rowIndex, stateName) {
    var colHeader = b05006Header[b05006ColIndex[stateName]];
    return parseValue(b05006Raw[rowIndex][colHeader]);
  }
 
  // Stores B05006 data by state
  var b05006Data = {};

  // Loops through each state in the column index (excluding Puerto Rico)
  // Then builds an object with total and state / continent values from B05006
  Object.keys(b05006ColIndex).forEach(function(state) {
    if (state === "Puerto Rico") return;
 
    b05006Data[state] = {
      state:    state,
      total:    getB05006Value(1,   state),
      europe:   getB05006Value(2,   state),
      asia:     getB05006Value(47,  state),
      africa:   getB05006Value(95,  state),
      oceania:  getB05006Value(130, state),
      americas: getB05006Value(138, state),
    };
  });
 
  // Merge the two datasets into a single array using B05006 as the b.c. as it covers more states
  var stateData = Object.keys(b05006Data).map(function(state) {
    var origin = b05006Data[state];
    var socio  = s0501Data[state] || null;
 
    return {
      // Identity data
      state:            state,
 
      // Foreign Born Pop. data
      foreignBornTotal: origin.total,
      origins: {
        europe:   origin.europe,
        asia:     origin.asia,
        africa:   origin.africa,
        oceania:  origin.oceania,
        americas: origin.americas,
      },
 
      // Education data
      missingS0501: socio ? socio.missingS0501 : true,
      education: socio ? {
        lessHS:      socio.edu_lessHS,
        hs:          socio.edu_HS,
        someCollege: socio.edu_someCollege,
        bachelors:   socio.edu_bachelors,
        graduate:    socio.edu_graduate,
      } : null,

      // Occupation data
      occupation: socio ? {
        management: socio.occ_management,
        service:    socio.occ_service,
        sales:      socio.occ_sales,
        naturalRes: socio.occ_naturalRes,
        production: socio.occ_production,
      } : null,

      // Income / Poverty data
      medianIncome: socio ? socio.medianIncome : null,
      povertyRate:  socio ? socio.povertyRate  : null,
    };
  });
 
  // Sort alphabetically to match precompiled datasets
  stateData.sort(function(a, b) { return a.state.localeCompare(b.state); });
 
}).catch(function(error) {
  console.error("error:", error);
});