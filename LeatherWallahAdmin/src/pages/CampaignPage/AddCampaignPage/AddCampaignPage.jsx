import { useContext, useEffect, useState } from "react";
import AddCampaign from "../../../components/Campaign/AddCampaign/AddCampaign";
import { AuthContext } from "../../../context/AuthProvider";

import useGetCampaign from "../../../hooks/useGetCampaign";
import useDebounced from "./../../../hooks/useDebounced";

const AddCampaignPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

  // Fetch category data
  const {
    data: campaignData,
    isLoading,
    refetch,
  } = useGetCampaign({ page, limit, searchTerm });

  // handle item search function....
  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
  }, [searchText]);

  // handle item search function....
  const handleSearchValue = (value) => {
    setSearchValue(value);
    setLimit(10);
    setPage(1);
  };

  return (
    <AddCampaign
      handleSearchValue={handleSearchValue}
      campaignData={campaignData}
      refetch={refetch}
      setLimit={setLimit}
      setPage={setPage}
      page={page}
      user={user}
      limit={limit}
      isLoading={isLoading}
      searchTerm={searchTerm}
    />
  );
};

export default AddCampaignPage;
