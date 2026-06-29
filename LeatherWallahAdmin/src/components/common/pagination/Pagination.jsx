// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// const Pagination = ({ rows, page, setPage, setRows, totalData }) => {
//   const lastPage = Math.ceil(totalData / rows);

//   const handleRowsChange = (event) => {
//     setPage(1);
//     setRows(parseInt(event.target.value, 10));
//   };

//   const handlePageClick = (pageNumber) => {
//     setPage(pageNumber);
//   };

//   return (
//     <div className="flex justify-center my-6">
//       {/* Rows per page selector */}
//       <div className="mr-10 flex items-center gap-2">
//         <label className="text-gray-500 font-semibold" htmlFor="rows_number">
//           Rows:
//         </label>
//         <select
//           onChange={handleRowsChange}
//           value={rows}
//           id="rows_number"
//           className="block w-full px-4 py-1 text-gray-700 bg-white border border-gray-200 rounded-md"
//         >
//           <option value="5">05</option>
//           <option value="10">10</option>
//           <option value="20">20</option>
//           <option value="30">30</option>
//           <option value="50">50</option>
//         </select>
//       </div>

//       {/* Previous button */}
//       <button
//         onClick={page > 1 ? () => setPage(page - 1) : null}
//         disabled={page === 1}
//         className={`border flex items-center justify-center  px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 capitalize bg-white rounded-md ${
//           page === 1
//             ? "text-gray-400"
//             : "hover:bg-primaryColor text-gray-600 hover:text-white"
//         }`}
//       >
//         <FaChevronLeft />
//       </button>

//       {/* Page numbers */}
//       {Array.from({ length: lastPage }, (_, index) => (
//         <button
//           key={index + 1}
//           onClick={() => handlePageClick(index + 1)}
//           className={`border px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 rounded-md ${
//             page === index + 1
//               ? "bg-primaryColor text-white"
//               : "bg-white text-gray-600 hover:bg-primary-100"
//           }`}
//         >
//           {index + 1}
//         </button>
//       ))}

//       {/* Next button */}
//       <button
//         onClick={page < lastPage ? () => setPage(page + 1) : null}
//         disabled={page === lastPage}
//         className={`border flex items-center justify-center px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 capitalize bg-white rounded-md ${
//           page === lastPage
//             ? "text-gray-400"
//             : "hover:bg-primaryColor text-gray-600 hover:text-white"
//         }`}
//       >
//         <FaChevronRight />
//       </button>
//     </div>
//   );
// };

// export default Pagination;

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useState } from 'react'

const Pagination = ({ limit, page, setPage, setLimit, totalData }) => {
  const lastPage = Math.ceil(totalData / limit)
  const maxPageButtons = 5 // Maximum number of pages to show in pagination
  const [jumpPage, setJumpPage] = useState('')

  const handleRowsChange = (event) => {
    setPage(1)
    setLimit(parseInt(event.target.value, 10))
  }

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber)
  }

  const handlePageJump = (event) => {
    event.preventDefault()
    const pageNumber = Math.max(1, Math.min(lastPage, parseInt(jumpPage, 10)))
    if (!isNaN(pageNumber)) {
      setPage(pageNumber)
      setJumpPage('')
    }
  }

  const getPageButtons = () => {
    const pageButtons = []
    let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2))
    let endPage = Math.min(lastPage, startPage + maxPageButtons - 1)

    if (endPage - startPage < maxPageButtons - 1) {
      startPage = Math.max(1, endPage - maxPageButtons + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          type='button'
          className={`border  px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 rounded-md ${
            page === i
              ? 'bg-primaryColor text-white'
              : 'bg-white text-gray-600 hover:bg-primary-100'
          }`}
        >
          {i}
        </button>
      )
    }

    return pageButtons
  }

  return (
    <div className='flex justify-end sm:text-sm gap-y-2 text-[10px] my-6 flex-wrap'>
      {/* Rows per page selector */}
      <div className=' flex items-center gap-2'>
        <label className='text-gray-500 font-semibold' htmlFor='rows_number'>
          Rows:
        </label>
        <select
          onChange={handleRowsChange}
          value={limit}
          id='rows_number'
          className='block w-full px-1 sm:px-2 py-1 sm:py-2 text-gray-700 bg-white border border-gray-200 rounded-md'
        >
          <option value='5'>05</option>
          <option value='10'>10</option>
          <option value='20'>20</option>
          <option value='30'>30</option>
          <option value='50'>50</option>
        </select>
      </div>

      {/* Previous button */}
      <button
        onClick={page > 1 ? () => setPage(page - 1) : null}
        disabled={page === 1}
        type='button'
        className={`border flex items-center justify-center  px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 capitalize bg-white rounded-md ${
          page === 1
            ? 'text-gray-400'
            : 'hover:bg-primaryColor text-gray-600 hover:text-white'
        }`}
      >
        <FaChevronLeft />
      </button>

      {/* Page numbers */}
      {lastPage > maxPageButtons && page > Math.floor(maxPageButtons / 2) && (
        <button
          onClick={() => setPage(1)}
          type='button'
          className='border  px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 rounded-md bg-white text-gray-600 hover:bg-primary-100'
        >
          1
        </button>
      )}
      {lastPage > maxPageButtons &&
        page > Math.floor(maxPageButtons / 2) + 1 && (
          <span className='px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 text-gray-600'>
            ...
          </span>
        )}
      {getPageButtons()}
      {lastPage > maxPageButtons &&
        page < lastPage - Math.floor(maxPageButtons / 2) && (
          <span className='px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 text-gray-600'>
            ...
          </span>
        )}
      {lastPage > maxPageButtons && page < lastPage - maxPageButtons / 2 && (
        <button
          onClick={() => setPage(lastPage)}
          type='button'
          className='border  px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 rounded-md bg-white text-gray-600 hover:bg-primary-100'
        >
          {lastPage}
        </button>
      )}

      {/* Next button */}
      <button
        onClick={page < lastPage ? () => setPage(page + 1) : null}
        disabled={page === lastPage}
        type='button'
        className={`border flex items-center justify-center  px-1.5 py-1 mx-[1px] sm:mx-1 sm:px-2 sm:py-1.5 md:py-2 md:px-3 capitalize bg-white rounded-md ${
          page === lastPage
            ? 'text-gray-400'
            : 'hover:bg-primaryColor text-gray-600 hover:text-white'
        }`}
      >
        <FaChevronRight />
      </button>

      {/* Page jump input - Only show if lastPage exceeds maxPageButtons */}
      {lastPage > maxPageButtons && (
        <form
          onSubmit={handlePageJump}
          className='ml-4 flex items-center gap-2'
        >
          <label htmlFor='page_jump' className='text-gray-500 font-semibold'>
            Go to page:
          </label>
          <input
            type='number'
            id='page_jump'
            value={jumpPage}
            placeholder='jump to page'
            onChange={(e) => setJumpPage(e.target.value)}
            className=' w-10 sm:w-16 px-2 py-1 border border-gray-200 rounded-md'
            min={1}
            max={lastPage}
          />
          <button
            type='submit'
            className='px-3 py-1 bg-primaryColor text-white rounded-md hover:bg-primaryDark'
          >
            Go
          </button>
        </form>
      )}
    </div>
  )
}

export default Pagination
