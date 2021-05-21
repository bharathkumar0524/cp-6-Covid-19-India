const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializaDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB ERROR:${error.message}`);
    process.exit(1);
  }
};
initializaDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

////////////////////////////
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
        *
    FROM
        state
    ;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

/////////////////////////////////
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
        *
    FROM
        state
    WHERE
        state_id = ${stateId}
    ;`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

////////////////////////////////////
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO 
        district(district_name,state_id,cases,cured,active,deaths) 
    VALUES 
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths})
    ;`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//////////////////////////////////

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictQuery = `
    SELECT 
        *
    FROM
        district
    WHERE
        district_id = ${districtId}
    ;`;
  const district = await db.get(getdistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

////////////////////////////////////

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedistrictQuery = `
    DELETE
    FROM
        district
    WHERE
        district_id = ${districtId}
    ;`;
  await db.run(deletedistrictQuery);
  response.send("District Removed");
});

///////////////////////////////////

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;

  const postDistrictQuery = `
    UPDATE 
        district
    SET
        
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths} 
    WHERE
        district_id = ${districtId}
    ;`;
  await db.run(postDistrictQuery);
  response.send("District Details Updated");
});

//////////////////////////////

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

////////////////////////////////

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
