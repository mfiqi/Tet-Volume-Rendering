import vtk
import numpy as np
# Create the reader for the .vtu file
reader = vtk.vtkXMLUnstructuredGridReader()

# Set the file name
reader.SetFileName('C:\\Users\\musab\\mfiqi.github.io\\dist\\data\\tetmesh.vtu')

# Read the file
reader.Update()

# Get the output of the reader
unstructured_grid = reader.GetOutput()

# Print some information about the unstructured grid
print(f"Number of points: {unstructured_grid.GetNumberOfPoints()}")
print(f"Number of cells: {unstructured_grid.GetNumberOfCells()}")

# ----> Convert to vtkPolyData <----
geometryFilter = vtk.vtkGeometryFilter()
geometryFilter.SetInputData(unstructured_grid)
geometryFilter.Update()
polydata = geometryFilter.GetOutput() 

# Create a decimation filter
decimate = vtk.vtkDecimatePro()
decimate.SetInputData(polydata)  # Use the converted polydata

# Set the target reduction (percentage of triangles to remove)
decimate.SetTargetReduction(0.5)  # Reduce by 50%

# Preserve topology
decimate.PreserveTopologyOn()

# Perform the decimation
decimate.Update()

# Get the decimated output
decimated_grid = decimate.GetOutput()

# Print information about the decimated grid
print(f"Number of points after decimation: {decimated_grid.GetNumberOfPoints()}")
print(f"Number of cells after decimation: {decimated_grid.GetNumberOfCells()}")


# Opening and Closing a file "MyFile.txt"
# for object name file1.

file1 = open("MyFile.txt","w")

file1.write("Points\n")

# Access point data
points = decimated_grid.GetPoints()
for i in range(points.GetNumberOfPoints()):
    point = points.GetPoint(i)
    file1.write(str(point)+"\n")


file1.write("Indices\n")

uniqueIndices = np.array(10)

for i in range(decimated_grid.GetNumberOfCells()):
    cell = decimated_grid.GetCell(i)
    cell_points = cell.GetPointIds()
    # for j in range(cell_points.GetNumberOfIds()):
    #     cell_point = cell_points.GetId(j)
    #     if (not np.isin(uniqueIndices,cell_point)):
    #         np.append(uniqueIndices,cell_point)

    file1.write(str([cell_points.GetId(j) for j in range(cell_points.GetNumberOfIds())])+"\n")


# Access cell data
# cells = unstructured_grid.GetCells()
# for i in range(cells.GetNumberOfCells()):
#     cell = cells.GetCell(i)
#     print(f"Cell {i}: {cell}")


file1.close()