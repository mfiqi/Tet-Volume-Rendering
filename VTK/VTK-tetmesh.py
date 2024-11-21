import vtk
import numpy as np
# Create the reader for the .vtu file
reader = vtk.vtkXMLUnstructuredGridReader()

# Set the file name
reader.SetFileName('C:\\Users\\musab\\mfiqi.github.io\\VTK\\xxsmall.vtu')

# Read the file
reader.Update()

# Get the output of the reader
unstructured_grid = reader.GetOutput()

# Print some information about the unstructured grid
print(f"Number of points: {unstructured_grid.GetNumberOfPoints()}")
print(f"Number of cells: {unstructured_grid.GetNumberOfCells()}")


# # Extract the surface of the unstructured grid
# surface_filter = vtk.vtkDataSetSurfaceFilter()
# surface_filter.SetInputData(unstructured_grid)
# surface_filter.Update()
# 
# # ------------------------------------------------------------------------
# # Triangulate the mesh
# # ------------------------------------------------------------------------
# 
# triangulator = vtk.vtkTriangleFilter()
# triangulator.SetInputData(surface_filter.GetOutput())  # Input is the output of surface_filter
# triangulator.Update()
# 
# # Now use the output of the triangulator for decimation
# polydata = triangulator.GetOutput()
# 
# # ------------------------------------------------------------------------
# # Decimation
# # ------------------------------------------------------------------------
# 
# # Create a decimation filter
# decimate = vtk.vtkDecimatePro()
# 
# # Set the input to the decimation filter (now vtkPolyData)
# decimate.SetInputData(polydata) 
# 
# # Set the desired reduction (e.g., 50% reduction)
# decimate.SetTargetReduction(0.999)
# 
# # Preserve the topology of the mesh
# decimate.PreserveTopologyOn()
# 
# # Update the filter
# decimate.Update()
# 
# # Get the output of the decimation filter
# decimated_grid = decimate.GetOutput()
# 
# # Print information about the decimated grid
# print(f"Number of points after decimation: {decimated_grid.GetNumberOfPoints()}")
# print(f"Number of cells after decimation: {decimated_grid.GetNumberOfCells()}")
# 
# # ------------------------------------------------------------------------
# # Save the decimated mesh (as vtkPolyData)
# # ------------------------------------------------------------------------
# 
# # Create a writer for VTP files (for polydata)
# writer = vtk.vtkXMLPolyDataWriter()
# 
# # Set the file name for the output (use .vtp extension)
# writer.SetFileName("decimated_mesh.vtp")  
# 
# # Set the input to the writer
# writer.SetInputData(decimated_grid)
# 
# # Write the file
# writer.Write()

# ------------------------------------------------------------------------
# (Optional) Visualization
# ------------------------------------------------------------------------

# Create a mapper and actor for the original mesh
# mapper = vtk.vtkDataSetMapper()
# mapper.SetInputData(unstructured_grid)
# 
# actor = vtk.vtkActor()
# actor.SetMapper(mapper)
# 
# # Create a mapper and actor for the decimated mesh
# decimated_mapper = vtk.vtkDataSetMapper()
# decimated_mapper.SetInputData(decimated_grid)
# 
# decimated_actor = vtk.vtkActor()
# decimated_actor.SetMapper(decimated_mapper)
# decimated_actor.GetProperty().SetColor(1.0, 0.0, 0.0)  # Set color to red
# 
# # Create a renderer, render window, and interactor
# renderer = vtk.vtkRenderer()
# render_window = vtk.vtkRenderWindow()
# render_window.AddRenderer(renderer)
# render_window_interactor = vtk.vtkRenderWindowInteractor()
# render_window_interactor.SetRenderWindow(render_window)
# 
# # Add the actors to the renderer
# #renderer.AddActor(actor)
# renderer.AddActor(decimated_actor)
# 
# # Set background color
# renderer.SetBackground(0.2, 0.3, 0.4)
# 
# # Render and interact
# render_window.Render()
# render_window_interactor.Start()

# # Create a writer for VTP files (for polydata)
# writer = vtk.vtkXMLPolyDataWriter()
# 
# # Set the file name for the output (use .vtp extension)
# writer.SetFileName("decimated_mesh.vtp")  
# 
# # Set the input to the writer
# writer.SetInputData(decimated_grid)
# 
# # Write the file
# writer.Write()

# Opening and Closing a file "MyFile.txt"
# for object name file1.
file1 = open("xxsmall.txt","w")

file1.write("Points\n")

# Access point data
points = unstructured_grid.GetPoints()
for i in range(points.GetNumberOfPoints()):
    point = points.GetPoint(i)
    file1.write(str(point)+"\n")


file1.write("Indices\n")

uniqueIndices = np.array(10)

for i in range(unstructured_grid.GetNumberOfCells()):
    cell = unstructured_grid.GetCell(i)
    cell_points = cell.GetPointIds()
    file1.write(str([cell_points.GetId(j) for j in range(cell_points.GetNumberOfIds())])+"\n")

#Get the tur_mu array
tur_mu_array = unstructured_grid.GetPointData().GetArray("tur_mu")

file1.write("tur_mu\n")

# Write tur_mu values to the file
for i in range(tur_mu_array.GetNumberOfTuples()):
    tur_mu_value = tur_mu_array.GetTuple1(i)
    file1.write(str(tur_mu_value)+"\n")


file1.close()