export const membershipNftQuery = `
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

export const filterMembershipNftByContractQuery = `
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

export const associationBadgeQuery = `
  query($lastId: String) {
    associationBadges(first: 1000, where: {id_gt: $lastId}) {
      contractAddress {
        id
        name
      }
      tokenID
      time
      claimer
      id
    }
  }
`;

export const filterAssociationBadgeByContractQuery = `
  query($lastId: String) {
    associationBadges(first: 1000, where: {contractAddress: $contractAddress, id_gt: $lastId}) {
      contractAddress {
        id
        name
      }
      tokenID
      time
      claimer
      id
    }
  }
`;
