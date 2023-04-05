import { createClient } from "urql";
// import { membershipNftQuery } from "./subgraphQueries";
const client = createClient({
  url: "https://api.thegraph.com/subgraphs/name/eth-jashan/rep3-matic",
});

export const subgraphFetcher = async (query, responseKey, variables = {}) => {
  let subgraphData = [];
  let lastId = "";
  let data = await client.query(query, { lastId, ...variables }).toPromise();
  while (data?.data?.[responseKey]?.length) {
    console.count("in ");
    subgraphData = [...subgraphData, data?.data?.[responseKey]];
    const newLastId =
      data?.data?.[responseKey]?.[data?.data?.[responseKey]?.length - 1]?.id;
    if (newLastId !== lastId) {
      lastId = newLastId;
      const tempData = await client.query(query, { lastId }).toPromise();
      data = tempData;
    }
  }
  const dataToSort = subgraphData?.reduce((acc, curr) => [...acc, ...curr], []);
  dataToSort.sort((a, b) => b.time - a.time);
  const dataAfterSort = dataToSort?.map((ele) => ({ ...ele }));

  return dataAfterSort;
};

export const associationNFTsFetcher = async (query, variables = {}) => {
  let subgraphData = [];
  let lastId = "";
  let data = await client.query(query, { lastId, ...variables }).toPromise();
  while (data?.data?.membershipNFTs?.length) {
    subgraphData = [...subgraphData, data?.data?.membershipNFTs];
    const newLastId =
      data?.data?.membershipNFTs?.[data?.data?.membershipNFTs?.length - 1]?.id;
    if (newLastId !== lastId) {
      lastId = newLastId;
      const tempData = await client.query(query, { lastId }).toPromise();
      data = tempData;
    }
  }
  const dataToSort = subgraphData?.reduce((acc, curr) => [...acc, ...curr], []);
  dataToSort.sort((a, b) => b.time - a.time);
  const dataAfterSort = dataToSort?.map((ele) => ({ ...ele }));

  return dataAfterSort;
};
