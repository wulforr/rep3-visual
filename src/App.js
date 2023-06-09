/* eslint-disable no-unused-vars */

import "./App.scss";
import { useEffect, useRef, useState } from "react";
import * as dayjs from "dayjs";
import * as advancedFormat from "dayjs/plugin/advancedFormat";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import { Select, Table, Input, Statistic, Card, Col, Row } from "antd";
import "antd/dist/reset.css";
import {
  membershipNftQuery,
  filterMembershipNftByContractQuery,
  associationBadgeQuery,
  filterAssociationBadgeByContractQuery,
} from "./utils/subgraphQueries";
import { subgraphFetcher } from "./utils/subgraphFetcher";
import Lottie from "react-lottie";
import * as animationData from "./assets/pleaseWait.json";

const { Search } = Input;
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
const columns = [
  {
    title: "Index",
    dataIndex: "index",
    key: "index",
    width: 100,
  },
  {
    title: "Claimer",
    dataIndex: "claimer",
    key: "claimer",
  },
  {
    title: "Contract Address",
    dataIndex: "contractAddress",
    key: "contractAddress",
  },
  {
    title: "TokenId",
    dataIndex: "tokenId",
    key: "tokenId",
    width: 100,
  },
];

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

function App() {
  dayjs.extend(advancedFormat);
  // const [chartData, setChartData] = useState([]);
  const [sortedChartData, setSortedChartData] = useState([]);
  const fetchedQuery = useRef(false);
  const [selectedDateData, setSelectedDateData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("1 month");
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [tableData, setTableData] = useState(null);
  const [associationBadgeTableData, setAssociationBadgeTableData] =
    useState(null);

  const groupDataByTime = (sortedData) => {
    const timeFormattedData = sortedData?.map((ele) => {
      return {
        ...ele,
        timeFormatted: dayjs.unix(ele.time).format("DD MMM YYYY"),
      };
    });

    const dataByDate = timeFormattedData?.reduce((acc, curr) => {
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

    return groupArrays;
  };

  const mergeArrays = (arr1, arr2) => {
    const arr1Length = arr1?.length;
    const arr2Length = arr2?.length;
    let x = 0;
    let y = 0;
    const mergedArray = [];
    while (x < arr1Length && y < arr2Length) {
      if (arr1[x]?.dateUnix === arr2[y]?.dateUnix) {
        mergedArray.push({
          ...arr1[x],
          associationBadges: arr2[y]?.nfts,
          associationBadgesAmount: arr2[y]?.nftsAmount,
        });
        x++;
        y++;
      } else if (arr1[x]?.dateUnix < arr2[y]?.dateUnix) {
        mergedArray.push({
          ...arr1[x],
          associationBadges: [],
          associationBadgesAmount: 0,
        });
        x++;
      } else {
        mergedArray.push({
          ...arr2[y],
          associationBadges: arr2[y]?.nfts,
          associationBadgesAmount: arr2[y]?.nftsAmount,
          nftsAmount: 0,
          nfts: [],
        });
        y++;
      }
    }
    while (x < arr1Length) {
      mergedArray.push({
        ...arr1[x],
        associationBadges: [],
        associationBadgesAmount: 0,
      });
      x++;
    }
    while (y < arr2Length) {
      mergedArray.push({
        ...arr2[y],
        associationBadges: arr2[y]?.nfts,
        associationBadgesAmount: arr2[y]?.nftsAmount,
        nftsAmount: 0,
        nfts: [],
      });
      y++;
    }

    return mergedArray;
  };

  const separateMintedAndUpgraded = (data) => {
    const dataMapped = data?.map((ele, index) => {
      const isFirstElement = data.findIndex(
        (element) =>
          element?.contractAddress?.id === ele?.contractAddress?.id &&
          element?.claimer === ele?.claimer
      );
      console.log("is first", index, isFirstElement);
      return {
        ...ele,
        isMembershipMint: isFirstElement === index,
      };
    });
    return dataMapped;
    // {
    //   minted: dataMapped?.filter((ele) => ele.isMembershipMint),
    //   upgraded: dataMapped?.filter((ele) => !ele?.isMembershipMint),
    // };
  };

  useEffect(() => {
    const fetchChartData = async () => {
      const dataAfterSort = await subgraphFetcher(
        membershipNftQuery,
        "membershipNFTs"
      );
      console.log("data after sort", dataAfterSort);
      const separated = separateMintedAndUpgraded(dataAfterSort);
      console.log("sepedksmc", separated);
      const groupedMembershipNFTs = groupDataByTime(separated);
      const associationBadges = await subgraphFetcher(
        associationBadgeQuery,
        "associationBadges"
      );
      const groupedAssociationBadges = groupDataByTime(associationBadges);
      const mergedArray = mergeArrays(
        groupedMembershipNFTs,
        groupedAssociationBadges
      );
      setSortedChartData(mergedArray);
    };
    if (!fetchedQuery?.current) {
      fetchedQuery.current = true;
      fetchChartData();
    }
  }, []);

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
        setFilteredData(temp);
        setSelectedDateData(null);
      } else {
        setFilteredData(sortedChartData);
      }
    }
  }, [selectedFilter, sortedChartData]);

  useEffect(() => {
    if (selectedDateData) {
      const temp = selectedDateData?.nfts?.map((ele, index) => {
        return {
          claimer: ele?.claimer,
          contractAddress: ele?.contractAddress?.id,
          tokenId: ele?.tokenID,
          index: index + 1,
        };
      });
      setTableData(temp);
      const temp2 = selectedDateData?.associationBadges?.map((ele, index) => {
        return {
          claimer: ele?.claimer,
          contractAddress: ele?.contractAddress?.id,
          tokenId: ele?.tokenID,
          index: index + 1,
        };
      });
      setAssociationBadgeTableData(temp2);
    }
  }, [selectedDateData]);

  const handleFilterChange = (value) => {
    console.log("value", value);
    setSelectedFilter(value);
  };

  const handleSearchInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const searchContract = async () => {
    setSearchLoading(true);
    const dataAfterSort = await subgraphFetcher(
      filterMembershipNftByContractQuery,
      "membershipNFTs",
      {
        contractAddress: searchValue,
      }
    );
    const separated = separateMintedAndUpgraded(dataAfterSort);
    const groupedMembershipNFTs = groupDataByTime(separated);

    const associationBadges = await subgraphFetcher(
      filterAssociationBadgeByContractQuery,
      "associationBadges",
      {
        contractAddress: searchValue,
      }
    );
    const groupedAssociationBadges = groupDataByTime(associationBadges);

    const mergedArray = mergeArrays(
      groupedMembershipNFTs,
      groupedAssociationBadges
    );
    setSortedChartData(mergedArray);
    setSearchLoading(false);
  };

  console.log("selected date data", selectedDateData);

  const numberOfMembershipMinted = filteredData?.reduce((acc, curr) => {
    return acc + curr?.nfts?.filter((ele) => ele?.isMembershipMint)?.length;
  }, 0);

  const numberOfMembershipUpgraded = filteredData?.reduce((acc, curr) => {
    return acc + curr?.nfts?.filter((ele) => !ele?.isMembershipMint)?.length;
  }, 0);

  const numberOfAssociationBadges = filteredData?.reduce((acc, curr) => {
    return acc + curr?.associationBadgesAmount;
  }, 0);

  const activeDaos = [
    ...new Set(
      filteredData
        ?.reduce((acc, curr) => {
          return [...acc, ...curr?.nfts, ...curr?.associationBadges];
        }, [])
        ?.map((ele) => ele?.contractAddress?.id)
    ),
  ];

  if (!sortedChartData?.length) {
    return (
      <div className="fetching-data">
        <Lottie options={defaultOptions} height={200} width={200} />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="search-input-wrapper">
        <Search
          placeholder="contract address"
          enterButton
          value={searchValue}
          onChange={handleSearchInputChange}
          onSearch={searchContract}
          size="large"
          loading={searchLoading}
        />
      </div>
      <div className="filter-input-wrapper">
        <Select
          options={filterOptions}
          onChange={handleFilterChange}
          value={selectedFilter}
          size="large"
        />
      </div>

      <div className="stats-wrapper">
        <Row gutter={{ xs: 16, lg: 24 }} className="stats-wrapper-row">
          <Col
            span={{
              xs: 24,
              lg: 6,
            }}
            className="stats-col"
          >
            <Card bordered={false}>
              <Statistic
                title="Membership Badges"
                value={numberOfMembershipMinted}
              />
            </Card>
          </Col>
          <Col
            span={{
              xs: 24,
              lg: 6,
            }}
            className="stats-col"
          >
            <Card bordered={false}>
              <Statistic
                title="Upgraded Badges"
                value={numberOfMembershipUpgraded}
              />
            </Card>
          </Col>
          <Col
            span={{
              xs: 24,
              lg: 6,
            }}
            className="stats-col"
          >
            <Card bordered={false}>
              <Statistic
                title="Association Badges"
                value={numberOfAssociationBadges}
              />
            </Card>
          </Col>
          <Col
            span={{
              xs: 24,
              lg: 6,
            }}
            className="stats-col"
          >
            <Card bordered={false}>
              <Statistic title="Active Daos" value={activeDaos?.length} />
            </Card>
          </Col>
        </Row>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        {/* <AreaChart
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
        </AreaChart> */}
        <ComposedChart
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
          {/* <Legend /> */}
          {/* <Line type="monotone" dataKey="nftsAmount" stroke="#82ca9d" /> */}
          {/* </LineChart> */}
          <Area
            type="monotone"
            dataKey="nftsAmount"
            stroke="#36A2EB"
            fill="#36A2EB"
          />
          <Line
            type="monotone"
            dataKey="associationBadgesAmount"
            stroke="#FF6484"
            activeDot={{ r: 8 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {selectedDateData ? (
        <div className="selected-date-data-wrapper">
          <div>Showing data for {selectedDateData?.date}</div>
          <div>
            Total nfts claimed or updated : {selectedDateData?.nftsAmount}{" "}
          </div>
          {tableData?.length ? (
            <div className="table-wrapper">
              <div className="table-title">Membership badges</div>

              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                scroll={{
                  y: 550,
                }}
              />
            </div>
          ) : (
            <></>
          )}

          {associationBadgeTableData?.length ? (
            <div className="table-wrapper">
              <div className="table-title">Association badges</div>
              <Table
                columns={columns}
                dataSource={associationBadgeTableData}
                pagination={false}
                scroll={{
                  y: 550,
                }}
              />
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
