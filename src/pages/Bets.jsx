import { useState, useEffect, useRef } from "react";
import {
  Table,
  Card,
  Spin,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  message,
} from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { FiDownload } from "react-icons/fi";
import { useGetBets, useGetBetsByPhone } from "../hooks/useGetBets";
import moment from "moment";
import _ from "lodash";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
import BetsExportModal from "../components/Modals/bets/BetsExportModal";

const { Text } = Typography;
const { Option } = Select;

function Bets() {
  const [exportVisible, setExportVisible] = useState(false);
  const { formatCurrency } = useFormatCurrency();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [betTypeFilter, setBetTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gameFilter, setGameFilter] = useState("all");
  const [searchMode, setSearchMode] = useState(false);

  const {
    bets,
    pagination: apiPagination,
    isLoading,
    refetch,
  } = useGetBets(pagination.current, pagination.pageSize);

  const {
    searchUserBets,
    isSearching,
    searchError,
    searchResults,
    searchPagination,
    resetSearch,
  } = useGetBetsByPhone();

  const debouncedSearch = useRef(
    _.debounce((phone, page, pageSize) => {
      if (phone.trim()) {
        setSearchMode(true);
        searchUserBets({ phone, page, limit: pageSize });
      } else {
        handleResetSearch();
      }
    }, 500)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    debouncedSearch(searchText, 1, pagination.pageSize);
  }, [searchText, debouncedSearch, pagination.pageSize]);

  useEffect(() => {
    if (searchError) {
      message.error(searchError.message);
    }
  }, [searchError]);

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });

    if (searchMode && searchText.trim()) {
      debouncedSearch(
        searchText,
        newPagination.current,
        newPagination.pageSize
      );
    }
  };

  const handleResetSearch = () => {
    setSearchMode(false);
    setSearchText("");
    resetSearch();
    setPagination({
      current: 1,
      pageSize: 10,
    });
  };

  // Determine which data to display
  const displayData = searchMode ? searchResults : bets;
  const displayLoading = isLoading || isSearching;

  const uniqueGames = [...new Set(bets.map((bet) => bet.game))];

  const filteredBets = (displayData || []).filter((bet) => {
    const matchesType = betTypeFilter === "all" || bet.type === betTypeFilter;
    const matchesStatus = statusFilter === "all" || bet.status === statusFilter;
    const matchesGame = gameFilter === "all" || bet.game === gameFilter;
    return matchesType && matchesStatus && matchesGame;
  });

  const columns = [
    {
      title: "Game",
      dataIndex: "game",
      key: "game",
      render: (game) => <Text strong>{game || "Unknown"}</Text>,
      filters: [
        { text: "All Games", value: "all" },
        ...uniqueGames.map((game) => ({ text: game, value: game })),
      ],
      onFilter: (value, record) => value === "all" || record.game === value,
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "win" ? "green" : "blue"}>
          {type.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "All Types", value: "all" },
        { text: "Sportsbook", value: "sportsbook" },
        { text: "Virtual", value: "virtual" },
      ],
      onFilter: (value, record) => value === "all" || record.type === value,
      ellipsis: true,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => (
        <Text strong type={record.type === "win" ? "success" : undefined}>
          {record.type === "win"
            ? `+${formatCurrency(amount)}`
            : formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
      ellipsis: true,
    },
    {
      title: "Balance",
      dataIndex: "recurringBalance",
      key: "recurringBalance",
      render: (amount) => {
        return <Text strong>{formatCurrency(amount ?? 0.0)}</Text>;
      },
      sorter: (a, b) => a.amount - b.amount,
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "won" ? "green" : status === "lost" ? "red" : "orange"}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "All Statuses", value: "all" },
        { text: "Open", value: "open" },
        { text: "Won", value: "won" },
        { text: "Lost", value: "lost" },
        { text: "Void", value: "void" },
      ],
      onFilter: (value, record) => value === "all" || record.status === value,
      ellipsis: true,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      ellipsis: true,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => moment(date).format("MMM DD, YYYY - hh:mm A"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      ellipsis: true,
    },
  ];

  const resetFilters = () => {
    setBetTypeFilter("all");
    setStatusFilter("all");
    setGameFilter("all");
    if (searchMode) {
      handleResetSearch();
    }
  };

  return (
    <Card
      title="Betting History"
      extra={
        <Button type="primary" onClick={refetch} loading={isLoading}>
          Refresh
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space size="middle" wrap style={{ width: "100%" }}>
          <Input
            placeholder="Search by phone number"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {searchMode && (
            <Button danger onClick={handleResetSearch}>
              Clear Search
            </Button>
          )}
          <Select
            placeholder="Filter by game"
            value={gameFilter}
            onChange={setGameFilter}
          >
            <Option value="all">All Games</Option>
            {uniqueGames.map((game) => (
              <Option key={game} value={game}>
                {game}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by type"
            value={betTypeFilter}
            onChange={setBetTypeFilter}
            style={{ width: 150, minWidth: "130px" }}
          >
            <Option value="all">All Types</Option>
            <Option value="sportsbook">Sportsbook</Option>
            <Option value="virtual">Virtual</Option>
          </Select>
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150, minWidth: "130px" }}
          >
            <Option value="all">All Statuses</Option>
            <Option value="open">Open</Option>
            <Option value="won">Won</Option>
            <Option value="lost">Lost</Option>
            <Option value="void">Void</Option>
          </Select>
          <Button icon={<FilterOutlined />} onClick={resetFilters}>
            Reset Filters
          </Button>{" "}
          <Button icon={<FiDownload />} onClick={() => setExportVisible(true)}>
            Export
          </Button>{" "}
          <BetsExportModal
            open={exportVisible}
            onCancel={() => setExportVisible(false)}
            filters={{
              type: betTypeFilter,
              status: statusFilter,
              game: gameFilter,
            }}
            phone={searchMode ? searchText : ""}
          />
        </Space>
      </div>

      <Spin
        spinning={displayLoading}
        tip={searchMode ? "Searching bets..." : "Loading bets..."}
      >
        <div style={{ overflowX: "auto" }}>
          <Table
            columns={columns}
            dataSource={filteredBets}
            rowKey={(record) => `${record.source}-${record.betId || record._id}`}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: searchMode ? searchPagination.total : apiPagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => (
                <Text>
                  Showing {range[0]}-{range[1]} of {total} bets
                </Text>
              ),
              className: "flex flex-wrap justify-center",
            }}
            onChange={handleTableChange}
            scroll={{ x: true }}
          />
        </div>
      </Spin>
    </Card>
  );
}

export default Bets;
