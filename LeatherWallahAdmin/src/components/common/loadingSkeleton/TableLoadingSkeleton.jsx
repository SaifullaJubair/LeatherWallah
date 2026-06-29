import Skeleton from 'react-loading-skeleton'

const TableLoadingSkeleton = () => {
  return (
    <div className='rounded-lg border border-gray-200 mt-6'>
      <div className='overflow-x-auto rounded-t-lg'>
        <table className='min-w-full divide-y-2 divide-gray-200 bg-white text-sm'>
          <thead className='ltr:text-left rtl:text-right bg-[#fff9ee]'>
            <tr className='divide-x divide-gray-300 font-semibold text-center text-gray-900'>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={50} />
              </th>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={140} />
              </th>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={50} />
              </th>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={100} />
              </th>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={120} />
              </th>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={80} />
              </th>
              <th className='whitespace-nowrap p-4 font-medium text-gray-900'>
                <Skeleton width={60} />
              </th>
            </tr>
          </thead>

          <tbody className='divide-y divide-gray-200 text-center'>
            {/* Creating 5 rows of skeletons as placeholders */}
            {[...Array(10)].map((_, i) => (
              <tr
                key={i}
                className={`divide-x divide-gray-200 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-tableRowBGColor'
                }`}
              >
                <td className='whitespace-nowrap px-4 py-2'>
                  <Skeleton width={30} />
                </td>
                <td className='whitespace-nowrap px-4 py-2'>
                  <Skeleton width={120} />
                </td>
                <td className='whitespace-nowrap px-4 py-2'>
                  <Skeleton width={50} />
                </td>
                <td className='whitespace-nowrap px-4 py-2'>
                  <Skeleton width={100} />
                </td>
                <td className='whitespace-nowrap px-4 py-2'>
                  <Skeleton width={120} />
                </td>
                <td className='whitespace-nowrap px-4 py-2'>
                  <Skeleton width={60} height={24} />
                </td>
                <td className='whitespace-nowrap px-4 py-2 flex items-center justify-center space-x-2'>
                  <Skeleton circle={true} width={25} height={25} />
                  <Skeleton circle={true} width={25} height={25} />
                  <Skeleton circle={true} width={25} height={25} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TableLoadingSkeleton
