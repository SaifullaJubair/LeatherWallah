import permissionsData, { PERMISSION_SECTIONS } from "../../data/permissionData";

// The permission checkboxes for the staff-role forms, laid out by sidebar section.
//
// Shared by CreateStaffRole and UpDateStaffRole — the two used to carry their own
// copy of the same render loop, which is how they drifted apart. One list, one
// layout, both forms.
//
// Flat, the list was 90-odd checkboxes in the order the modules were built, so
// giving someone "marketing access" meant finding Offer, Campaign, Coupon and
// Banner scattered through it. Grouping by the sidebar's own sections means a
// staff member's job maps to one block, and "Select all" grants it in a click.
const PermissionSections = ({ register, watchAllFields, setValue }) => {
  const bySection = PERMISSION_SECTIONS.map((section) => ({
    section,
    groups: permissionsData.filter((g) => g.section === section),
  })).filter((s) => s.groups.length > 0);

  // A group with no `section` (someone adds one and forgets) still renders, at the
  // end, rather than silently vanishing from the form.
  const unsectioned = permissionsData.filter(
    (g) => !PERMISSION_SECTIONS.includes(g.section),
  );
  if (unsectioned.length) {
    bySection.push({ section: "Other", groups: unsectioned });
  }

  const flagsIn = (groups) =>
    groups.flatMap((g) => g.Type.map((t) => t.type_value));

  const allChecked = (groups) =>
    flagsIn(groups).every((f) => watchAllFields[f] === true);

  const toggleSection = (groups, next) => {
    flagsIn(groups).forEach((f) => setValue(f, next, { shouldDirty: true }));
  };

  return (
    <div className="space-y-6">
      {bySection.map(({ section, groups }) => {
        const all = allChecked(groups);
        return (
          <div
            key={section}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800">{section}</h4>
              <button
                type="button"
                onClick={() => toggleSection(groups, !all)}
                className={`text-xs font-medium px-3 py-1 rounded border transition-colors ${
                  all
                    ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {all ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="p-3 space-y-3">
              {groups.map((group) => (
                <div key={`${section}-${group.Name}`}>
                  <p className="text-sm font-medium text-gray-600">
                    {group.Name}
                  </p>
                  {group.hint && (
                    <p className="text-xs text-gray-400 mb-1.5">{group.hint}</p>
                  )}
                  {!group.hint && <div className="mb-1.5" />}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {group.Type.map((permission) => {
                      const isChecked = watchAllFields[permission.type_value];
                      // A flag can appear in two sections (site_setting_update
                      // opens both Site Settings and Warehouses), so the DOM id
                      // is scoped to the section. react-hook-form registers both
                      // under the same field name, which is what we want: tick
                      // one and the other follows, because they ARE one flag.
                      const domId = `${section}-${permission.type_value}`;
                      return (
                        <label
                          key={domId}
                          htmlFor={domId}
                          className={`flex items-center border shadow-sm cursor-pointer p-2 rounded transition-colors ${
                            isChecked
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={domId}
                            {...register(permission.type_value)}
                            className="mr-2 outline-primaryVariant-600 shrink-0"
                          />
                          <span
                            className={`text-sm ${
                              isChecked ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {permission.type_name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionSections;
