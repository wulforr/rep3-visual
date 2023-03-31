/* eslint-disable no-unused-vars */

import logo from "./logo.svg";
import "./App.css";
import { useEffect, useRef, useState } from "react";
// import { useQuery } from "urql";
import * as dayjs from "dayjs";
import { createClient } from "urql";
import * as advancedFormat from "dayjs/plugin/advancedFormat";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Select } from "antd";

const membershipNftQuery = `
  query($lastId: String) {
    membershipNFTs(first: 1000, where: {id_gt: $lastId}) {
      contractAddress {
        id
        name
      }
      level
      tokenID
      time
      claimer
      id
    }
  }
`;

const contractNftQuery = `
query($contractAddress: String, $lastId: String) {
  membershipNFTs(first: 1000, where: {contractAddress: $contractAddress, id_gt: $lastId}) {
    contractAddress {
      id
      name
    }
    level
    tokenID
    time
    claimer
    id
  }
}
`;

const contractAddress = "0x8c2eee5a9aa45d32927bb167af0764225702e673";

function App() {
  const client = createClient({
    url: "https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-matic",
  });
  dayjs.extend(advancedFormat);
  // const [chartData, setChartData] = useState([]);
  const [sortedChartData, setSortedChartData] = useState([]);
  const fetchedQuery = useRef(false);
  const [selectedDateData, setSelectedDateData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("1 month");
  const filterOptions = [
    {
      label: "1 day",
      value: "1 day",
    },
    {
      label: "1 week",
      value: "1 week",
    },
    {
      label: "1 month",
      value: "1 month",
    },
    {
      label: "All",
      value: "All",
    },
  ];
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const fetchChartData = async () => {
      console.log("in fetch chart data");
      let subgraphData = [];
      let lastId = "";
      let data = await client.query(membershipNftQuery, { lastId }).toPromise();
      console.log("data from graph is", data);
      // const nfts = data?.data?.membershipNFTs;
      // console.log("nfts are", nfts);
      let x = 0;
      while (data?.data?.membershipNFTs?.length && x < 4) {
        console.log("in while with x", x);
        subgraphData = [...subgraphData, data?.data?.membershipNFTs];
        const newLastId =
          data?.data?.membershipNFTs?.[data?.data?.membershipNFTs?.length - 1]
            ?.id;
        console.log("new lastId", newLastId, lastId, lastId === newLastId);
        if (newLastId !== lastId) {
          lastId = newLastId;
          console.log("last id is", lastId);
          const tempData = await client
            .query(membershipNftQuery, { lastId })
            .toPromise();
          console.log("setting data as", tempData);
          data = tempData;
        }
        x++;
      }
      console.log("fetch data", subgraphData);
      const dataToSort = subgraphData?.reduce(
        (acc, curr) => [...acc, ...curr],
        []
      );
      dataToSort.sort((a, b) => b.time - a.time);
      const dataAfterSort = dataToSort?.map((ele) => ({ ...ele }));
      console.log("data after sort", dataAfterSort[0]);
      const sortedData = dataAfterSort?.map((ele) => {
        // console.count("ele is", ele, dayjs.unix(ele.time).format("DD MMM YYYY"));
        return {
          ...ele,
          timeFormatted: dayjs.unix(ele.time).format("DD MMM YYYY"),
        };
      });
      console.log("sorted data is in", sortedData);
      // setChartData(sortedData);

      const dataByDate = sortedData?.reduce((acc, curr) => {
        if (acc[curr?.timeFormatted]) {
          acc[curr?.timeFormatted].push(curr);
        } else {
          acc[curr?.timeFormatted] = [curr];
        }
        return acc;
      }, {});

      const groupArrays = Object.keys(dataByDate).map((date) => {
        return {
          date,
          dateUnix: dayjs(date).format("X"),
          nfts: dataByDate[date],
          nftsAmount: dataByDate[date]?.length,
        };
      });

      groupArrays.sort((a, b) => b.dateUnix - a.dateUnix);
      groupArrays?.reverse();

      console.log("data by date is", groupArrays);
      console.log(
        "date difference",
        dayjs(groupArrays[0]?.date).diff(dayjs(groupArrays[1]?.date), "d")
      );

      setSortedChartData(groupArrays);
    };
    if (!fetchedQuery?.current) {
      console.log("time is", dayjs.unix(1673807400));
      fetchedQuery.current = true;
      fetchChartData();
    }
  }, [client]);

  // useEffect(() => {
  //   const nfts = data?.membershipNFTs;
  //   console.log(
  //     "in useEffect",
  //     data?.membershipNFTs?.length,
  //     nfts?.[nfts?.length - 1]?.id,
  //     chartData?.[chartData?.length - 1]?.id
  //   );
  //   if (
  //     nfts?.length &&
  //     nfts?.[nfts?.length - 1]?.id !== chartData?.[chartData?.length - 1]?.id
  //   ) {
  //     const tempData = nfts?.map((ele) => {
  //       return {
  //         ...ele,
  //         // time: dayjs.unix(ele.time).format("DD MMM YYYY"),
  //       };
  //     });
  //     setChartData((chartData) => [...chartData, ...tempData]);
  //     console.log("setting lastId as ", tempData[tempData?.length - 1]?.id);
  //     setLastId(tempData[tempData?.length - 1]?.id);
  //     // reexecuteQuery();
  //   }
  // }, [data, chartData, reexecuteQuery]);

  // useEffect(() => {
  //   console.log(" in useffect chart data");
  //   // const tempChartData = chartData?.map((ele) => ({ ...ele }));
  //   // tempChartData.sort((a, b) => b.time - a.time);
  //   const tempData = chartData?.map((ele) => {
  //     return {
  //       ...ele,
  //       time: dayjs.unix(ele.time).format("DD MMM YYYY"),
  //     };
  //   });
  //   console.log(" vahbbnla", tempData);

  //   // setChartData((chartData) => [...chartData, ...tempData]);
  //   setSortedChartData(tempData);
  // }, [chartData]);

  // if (fetching) return <p>Loading...</p>;
  // if (error) return <p>Oh no... {error.message}</p>;

  // console.log("data is", data, chartData, sortedChartData);
  console.log("sorted data is", sortedChartData);

  useEffect(() => {
    if (selectedFilter && sortedChartData?.length) {
      if (selectedFilter !== "All") {
        const temp = sortedChartData?.filter(
          (ele) =>
            dayjs().diff(dayjs.unix(ele?.dateUnix), "d") <=
            (selectedFilter === "1 day"
              ? 1
              : selectedFilter === "1 week"
              ? 7
              : 30)
        );
        console.log("t is", temp);
        setFilteredData(temp);
      } else {
        setFilteredData(sortedChartData);
      }
    }
  }, [selectedFilter, sortedChartData]);

  if (!sortedChartData?.length) {
    return <div>Fetching data please wait</div>;
  }

  const handleFilterChange = (value) => {
    console.log("value", value);
    setSelectedFilter(value);
  };

  const handleSearchInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const searchContract = async () => {
    let subgraphData = [];
    let lastId = "";
    let data = await client
      .query(contractNftQuery, { lastId, contractAddress: searchValue })
      .toPromise();
    console.log("data from graph is", data);
    // const nfts = data?.data?.membershipNFTs;
    // console.log("nfts are", nfts);
    let x = 0;
    while (data?.data?.membershipNFTs?.length && x < 4) {
      console.log("in while with x", x);
      subgraphData = [...subgraphData, data?.data?.membershipNFTs];
      const newLastId =
        data?.data?.membershipNFTs?.[data?.data?.membershipNFTs?.length - 1]
          ?.id;
      console.log("new lastId", newLastId, lastId, lastId === newLastId);
      if (newLastId !== lastId) {
        lastId = newLastId;
        console.log("last id is", lastId);
        const tempData = await client
          .query(contractNftQuery, { lastId, contractAddress })
          .toPromise();
        console.log("setting data as", tempData);
        data = tempData;
      }
      x++;
    }
    const dataToSort = subgraphData?.reduce(
      (acc, curr) => [...acc, ...curr],
      []
    );
    dataToSort.sort((a, b) => b.time - a.time);
    const dataAfterSort = dataToSort?.map((ele) => ({ ...ele }));
    const sortedData = dataAfterSort?.map((ele) => {
      return {
        ...ele,
        timeFormatted: dayjs.unix(ele.time).format("DD MMM YYYY"),
      };
    });

    const dataByDate = sortedData?.reduce((acc, curr) => {
      if (acc[curr?.timeFormatted]) {
        acc[curr?.timeFormatted].push(curr);
      } else {
        acc[curr?.timeFormatted] = [curr];
      }
      return acc;
    }, {});

    const groupArrays = Object.keys(dataByDate).map((date) => {
      return {
        date,
        dateUnix: dayjs(date).format("X"),
        nfts: dataByDate[date],
        nftsAmount: dataByDate[date]?.length,
      };
    });

    groupArrays.sort((a, b) => b.dateUnix - a.dateUnix);
    groupArrays?.reverse();

    setSortedChartData(groupArrays);
    console.log("sorted chart data", groupArrays);
  };

  return (
    <div className="App">
      <input
        type="text"
        value={searchValue}
        onChange={handleSearchInputChange}
        placeholder="contract address"
      />
      <button onClick={searchContract}>Search</button>
      <Select
        options={filterOptions}
        onChange={handleFilterChange}
        value={selectedFilter}
      />
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          width={700}
          height={400}
          data={filteredData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
          onClick={(data) => {
            console.log("clicked data", data);
            setSelectedDateData(data?.activePayload[0]?.payload);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="nftsAmount"
            stroke="#8884d8"
            fill="#8884d8"
          />
        </AreaChart>
      </ResponsiveContainer>

      {selectedDateData ? (
        <div>
          <div>Showing data for {selectedDateData?.date}</div>
          <div>Total nfts claimed : {selectedDateData?.nftsAmount} </div>
          {selectedDateData?.nfts?.map((ele, index) => (
            <div key={index}>
              claimed by {ele?.claimer} for contract{" "}
              {ele?.contractAddress?.name}:{ele?.contractAddress?.id}
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
