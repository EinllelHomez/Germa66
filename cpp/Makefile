CXX = g++
CXXFLAGS = -std=c++17 -Wall -Iinclude
SRC = src/RecursoMilitar.cpp src/TrajeCombate.cpp src/ArmamentoPesado.cpp src/MotorReportes.cpp src/main.cpp
OBJ = $(SRC:.cpp=.o)
BIN = reportes

all: $(BIN)

$(BIN): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $(BIN) $(OBJ)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

run: all
	./$(BIN) data/inventario.csv data/pedidos.csv

clean:
	rm -f $(OBJ) $(BIN)

TEST_SRC = src/RecursoMilitar.cpp src/TrajeCombate.cpp src/ArmamentoPesado.cpp src/MotorReportes.cpp test/test_recursos.cpp
probar:
	$(CXX) $(CXXFLAGS) -o test/probar $(TEST_SRC)
	./test/probar
