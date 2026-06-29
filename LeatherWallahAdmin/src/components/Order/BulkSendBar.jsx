import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const BulkSendBar = ({ selectedCount, onBulkSend, onClear, loading }) => (
  <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
    <span className="text-sm text-blue-700 font-medium">
      {selectedCount} টা order selected
    </span>
    <button
      onClick={onBulkSend}
      disabled={loading}
      className="h-[32px] rounded-lg px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-medium"
    >
      {loading ? <MiniSpinner /> : "Bulk Send to Steadfast"}
    </button>
    <button
      onClick={onClear}
      className="text-xs text-gray-500 hover:text-gray-700 underline"
    >
      Clear
    </button>
  </div>
);

export default BulkSendBar;
